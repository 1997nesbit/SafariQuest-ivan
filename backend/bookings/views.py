from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from accounts.views import _set_auth_cookies
from audit.utils import log_action
from config.mail import send_notification
from config.pagination import StandardPagination
from referrals.models import ReferralCode, ReferralRedemption, ReferralSettings

from .models import Booking, BookingNote, Invoice, Review, TripMilestone
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    BookingNoteInputSerializer,
    BookingPaySerializer,
    BookingUpdateSerializer,
    InvoiceDetailSerializer,
    InvoiceSerializer,
    InvoiceUpdateSerializer,
    MilestoneCompleteSerializer,
    QuoteUpdateSerializer,
    ReviewInputSerializer,
    TripMilestoneSerializer,
)

User = get_user_model()

INVOICE_DUE_DAYS = 14


class BookingViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    throttle_scope = "booking_create"
    pagination_class = StandardPagination
    queryset = Booking.objects.select_related(
        "customer", "safari", "region_safari", "region_safari__region", "assigned_guide", "review"
    ).prefetch_related("line_items", "notes", "milestones")

    def get_throttles(self):
        # Anonymous create can mint a User row and send mail to a caller-supplied
        # address, so it gets a tight scoped limit; everything else keeps the defaults.
        if self.action == "create":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ("list", "retrieve", "milestones", "complete_milestone", "review", "pay", "pay_balance"):
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_serializer_class(self):
        if self.action == "list":
            return BookingListSerializer
        if self.action == "create":
            return BookingCreateSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == User.ROLE_TOURIST:
            queryset = queryset.filter(customer=user)
        elif user.role == User.ROLE_GUIDE:
            queryset = queryset.filter(assigned_guide__user=user)
        elif user.role != User.ROLE_ADMIN:
            return queryset.none()

        stage = self.request.query_params.get("stage")
        if stage:
            queryset = queryset.filter(stage=stage)
        region = self.request.query_params.get("region")
        if region:
            queryset = queryset.filter(
                Q(safari__destination=region) | Q(region_safari__region__name=region)
            )
        guide = self.request.query_params.get("guide")
        if guide == "unassigned":
            queryset = queryset.filter(assigned_guide__isnull=True)
        elif guide:
            queryset = queryset.filter(assigned_guide_id=guide)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        response = Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)
        new_customer = getattr(booking, "_new_customer", None)
        if new_customer is not None:
            _set_auth_cookies(response, new_customer)
        return response

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        previous_stage = instance.stage
        serializer = BookingUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if instance.stage != previous_stage:
            log_action(
                request.user,
                "booking.stage_changed",
                f"Booking #{instance.id} moved from {previous_stage} to {instance.stage}",
            )
        return Response(BookingDetailSerializer(instance).data)

    @action(detail=True, methods=["patch"], url_path="quote")
    def quote(self, request, pk=None):
        booking = self.get_object()
        serializer = QuoteUpdateSerializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="notes")
    def notes(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingNoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        BookingNote.objects.create(booking=booking, author=request.user, text=serializer.validated_data["text"])
        booking.refresh_from_db()
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="quote/send", url_name="quote-send")
    def send_quote(self, request, pk=None):
        booking = self.get_object()
        if booking.stage not in (Booking.STAGE_NEW_INQUIRY, Booking.STAGE_QUOTED):
            return Response(
                {"detail": "This booking has already moved past the quoting stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not booking.line_items.exists():
            return Response(
                {"detail": "Add at least one line item before sending a quote."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Stage + invoice have to land together, or a crash between them leaves a
        # booking marked QUOTED with no invoice behind it. Mail goes out after
        # commit — best-effort (config.mail) and must not hold the transaction
        # open for an SMTP round trip.
        with transaction.atomic():
            booking.stage = Booking.STAGE_QUOTED
            booking.save(update_fields=["stage"])
            Invoice.objects.get_or_create(
                booking=booking,
                defaults={
                    "amount": booking.subtotal,
                    "due_date": timezone.localdate() + timedelta(days=INVOICE_DUE_DAYS),
                },
            )
        send_notification(
            subject=f"Your SafariQuest quote — {booking.package_title}",
            message=(
                f"Hi {booking.customer.name or booking.customer.email},\n\n"
                f"Your quote for {booking.package_title} is ready: ${booking.subtotal:,}. "
                "Please reply to confirm or ask any questions."
            ),
            recipient_list=[booking.customer.email],
        )
        log_action(request.user, "booking.quote_sent", f"Sent quote for booking #{booking.id} (${booking.subtotal:,})")
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=True, methods=["get"], url_path="milestones")
    def milestones(self, request, pk=None):
        booking = self.get_object()
        return Response(TripMilestoneSerializer(booking.milestones.all(), many=True).data)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"milestones/(?P<milestone_id>[^/.]+)/complete",
        url_name="milestone-complete",
    )
    def complete_milestone(self, request, pk=None, milestone_id=None):
        if request.user.role not in (User.ROLE_GUIDE, User.ROLE_ADMIN):
            return Response(status=status.HTTP_403_FORBIDDEN)
        booking = self.get_object()
        milestone = booking.milestones.filter(pk=milestone_id).first()
        if milestone is None:
            return Response({"detail": "Milestone not found."}, status=status.HTTP_404_NOT_FOUND)
        if milestone.status != TripMilestone.STATUS_CURRENT:
            return Response(
                {"detail": "Only the current milestone can be marked complete."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MilestoneCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Completing a milestone and advancing the next one are one step from
        # the guide's point of view; a crash between the two saves used to be
        # able to leave a trip with no CURRENT milestone at all, stuck.
        with transaction.atomic():
            milestone.status = TripMilestone.STATUS_COMPLETED
            milestone.note = serializer.validated_data.get("note", "")
            milestone.photo = serializer.validated_data.get("photo", "")
            milestone.completed_at = timezone.now()
            milestone.save()

            next_milestone = booking.milestones.filter(
                order=milestone.order + 1, status=TripMilestone.STATUS_UPCOMING
            ).first()
            if next_milestone:
                next_milestone.status = TripMilestone.STATUS_CURRENT
                next_milestone.save(update_fields=["status"])

        booking.refresh_from_db()
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        booking = self.get_object()
        if request.user.role != User.ROLE_TOURIST or booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if booking.stage != Booking.STAGE_COMPLETED:
            return Response(
                {"detail": "Only completed trips can be reviewed."}, status=status.HTTP_400_BAD_REQUEST
            )
        if Review.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "This booking has already been reviewed."}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # recompute_rating() is read-then-write off the Review rows, so it has
        # to commit together with the review that triggered it — otherwise a
        # crash right after create() leaves the guide's cached rating stale
        # until some unrelated later review happens to refresh it.
        with transaction.atomic():
            review = Review.objects.create(
                booking=booking, guide=booking.assigned_guide, **serializer.validated_data
            )
            if review.guide_id:
                review.guide.recompute_rating()
        booking.refresh_from_db()
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        """Records a mock deposit payment at checkout time (1.3). There's no payment
        gateway yet — card details never reach this endpoint, only the amount the
        checkout page already computed and showed the tourist. Real card processing is
        PLANNED; this exists so the booking → paid → confirmed flow is real end to end
        in the meantime, rather than faked with client-only state."""
        booking = self.get_object()
        if request.user.role != User.ROLE_TOURIST or booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if booking.stage != Booking.STAGE_NEW_INQUIRY:
            return Response(
                {"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = BookingPaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        referral_code_value = serializer.validated_data.get("referral_code")
        trip_total = serializer.validated_data.get("trip_total")

        # Stage + invoice have to land together, same reasoning as send_quote above —
        # a crash between them must not leave a "paid" booking with no invoice record.
        redemption = None
        with transaction.atomic():
            booking.stage = Booking.STAGE_DEPOSIT_PAID
            booking.save(update_fields=["stage"])
            invoice = Invoice.objects.create(
                booking=booking,
                amount=amount,
                trip_total=trip_total,
                status=Invoice.STATUS_DEPOSIT_PAID,
                due_date=timezone.localdate(),
            )
            if referral_code_value and trip_total:
                # select_for_update + is_used=False in the same atomic block is what makes
                # "once one person uses it, others can't" race-safe under concurrent redeems.
                # exclude(agent=...): an agent can also book now, and must not collect
                # commission on their own trip. The validate endpoint already refuses the
                # code at checkout; this is the backstop, dropped silently like any other
                # unusable code.
                referral_code = (
                    ReferralCode.objects.select_for_update()
                    .filter(code=referral_code_value.strip().upper(), is_used=False)
                    .exclude(agent=request.user)
                    .first()
                )
                if referral_code and not referral_code.is_expired:
                    settings_obj = ReferralSettings.get_solo()
                    commission_amount = round(trip_total * settings_obj.commission_percent / 100)
                    redemption = ReferralRedemption.objects.create(
                        code=referral_code,
                        booking=booking,
                        discount_percent=settings_obj.discount_percent,
                        commission_percent=settings_obj.commission_percent,
                        trip_total=trip_total,
                        commission_amount=commission_amount,
                    )
                    referral_code.is_used = True
                    referral_code.used_at = timezone.now()
                    referral_code.save(update_fields=["is_used", "used_at"])
        send_notification(
            subject=f"Payment received — {booking.package_title}",
            message=(
                f"Hi {booking.customer.name or booking.customer.email},\n\n"
                f"We've received your deposit of ${amount:,} for {booking.package_title}. This "
                "is a mock payment confirmation for testing — no real charge was made; card "
                "processing is coming soon. Thank you for booking with Pande Wilderness Safari!"
            ),
            recipient_list=[booking.customer.email],
        )
        log_action(
            request.user,
            "booking.payment_recorded",
            f"Mock deposit of ${amount:,} recorded for booking #{booking.id} (invoice #{invoice.id})",
        )
        if redemption:
            send_notification(
                subject="Your referral code was used!",
                message=(
                    f"Hi {redemption.code.agent.name or redemption.code.agent.email},\n\n"
                    f"Your referral code {redemption.code.code} was just used for a new booking. "
                    f"You've earned an estimated ${redemption.commission_amount:,} commission "
                    "(paid out once the customer's trip is complete). You can track this in your "
                    "referral dashboard."
                ),
                recipient_list=[redemption.code.agent.email],
            )
            log_action(
                request.user,
                "referral.code_redeemed",
                f"Referral code {redemption.code.code} redeemed on booking #{booking.id} "
                f"(commission ${redemption.commission_amount:,} owed to {redemption.code.agent.email})",
            )
        booking.refresh_from_db()
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="pay-balance")
    def pay_balance(self, request, pk=None):
        """Pays off whatever remains after the deposit, from the tourist's own dashboard —
        no re-authentication needed, it's just another authenticated request on the same
        cookie session. The amount is computed here from the invoice's trip_total rather than
        trusted from the client, unlike the deposit (there's nothing left to negotiate: it's
        exactly what's left)."""
        booking = self.get_object()
        if request.user.role != User.ROLE_TOURIST or booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        invoice = getattr(booking, "invoice", None)
        if not invoice or invoice.trip_total is None:
            return Response({"detail": "No balance is due on this booking."}, status=status.HTTP_400_BAD_REQUEST)
        remaining = invoice.remaining_balance
        if not remaining:
            return Response({"detail": "This booking is already fully paid."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            invoice.amount = invoice.trip_total
            invoice.status = Invoice.STATUS_PAID
            invoice.save(update_fields=["amount", "status"])
            booking.stage = Booking.STAGE_CONFIRMED
            booking.save(update_fields=["stage"])
        send_notification(
            subject=f"Balance paid — {booking.package_title}",
            message=(
                f"Hi {booking.customer.name or booking.customer.email},\n\n"
                f"We've received your remaining balance of ${remaining:,} for {booking.package_title}. "
                "Your trip is now fully paid and confirmed. This is a mock payment confirmation for "
                "testing — no real charge was made."
            ),
            recipient_list=[booking.customer.email],
        )
        log_action(
            request.user,
            "booking.balance_paid",
            f"Remaining balance of ${remaining:,} paid for booking #{booking.id} (invoice #{invoice.id})",
        )
        booking.refresh_from_db()
        return Response(BookingDetailSerializer(booking).data)


class InvoiceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Invoices are issued automatically when a quote is sent (2.2) or a checkout deposit is
    paid (1.3) — there's no create endpoint here. Status is otherwise set manually by Admin;
    there's no real payment gateway yet (5.1 / 5.2), just the mock checkout deposit above."""

    pagination_class = StandardPagination
    queryset = Invoice.objects.select_related(
        "booking", "booking__customer", "booking__safari", "booking__region_safari"
    ).prefetch_related("booking__line_items")
    permission_classes = [IsAdminRole]

    def get_permissions(self):
        if self.action == "mine":
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return InvoiceDetailSerializer
        return InvoiceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            # Was: load every invoice into Python and evaluate the
            # effective_status property row by row. Invoice.objects now knows
            # how to compute the same thing in SQL (see with_effective_status).
            queryset = queryset.with_effective_status().filter(effective_status_db=status_param)
        return queryset

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        """The signed-in tourist's own payment history (5.1, tourist-facing). Same shape as
        SupportTicketViewSet.mine — a small, inherently bounded set (one person's own
        invoices), so it deliberately skips pagination rather than going through list()."""
        invoices = self.get_queryset().filter(booking__customer=request.user)
        return Response(InvoiceSerializer(invoices, many=True).data)

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        previous_status = instance.status
        serializer = InvoiceUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if instance.status != previous_status:
            log_action(
                request.user,
                "invoice.status_changed",
                f"Invoice #{instance.id} moved from {previous_status} to {instance.status}",
            )
        return Response(InvoiceDetailSerializer(instance).data)

    @action(detail=True, methods=["post"], url_path="remind")
    def remind(self, request, pk=None):
        invoice = self.get_object()
        send_notification(
            subject=f"Payment reminder — {invoice.booking.package_title}",
            message=(
                f"Hi {invoice.booking.customer.name or invoice.booking.customer.email},\n\n"
                f"This is a reminder that ${invoice.amount:,} is due by {invoice.due_date} for "
                f"your {invoice.booking.package_title} booking. Please reply if you have any "
                "questions."
            ),
            recipient_list=[invoice.booking.customer.email],
        )
        return Response(InvoiceSerializer(invoice).data)


class FinanceSummaryView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        # Was: `list(Invoice.objects.all())` — every invoice, every related
        # row prefetched by the model default, loaded into Python — then three
        # passes over that list. A handful of SQL aggregates replace it.
        invoices = Invoice.objects.with_effective_status()
        total_invoiced = invoices.aggregate(total=Sum("amount"))["total"] or 0
        total_collected = (
            invoices.filter(effective_status_db=Invoice.STATUS_PAID).aggregate(total=Sum("amount"))["total"] or 0
        )
        overdue = invoices.filter(effective_status_db="overdue").aggregate(count=Count("id"), total=Sum("amount"))
        return Response(
            {
                "total_invoiced": total_invoiced,
                "total_collected": total_collected,
                "total_outstanding": total_invoiced - total_collected,
                "overdue_count": overdue["count"] or 0,
                "overdue_amount": overdue["total"] or 0,
            }
        )
