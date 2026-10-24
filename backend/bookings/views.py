import json
import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Case, Count, F, IntegerField, Q, Sum, Value, When
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from audit.utils import log_action
from config.mail import send_notification
from config.pagination import StandardPagination
from referrals.models import ReferralCode, ReferralSettings

from . import snippe
from .models import Booking, BookingNote, Invoice, Payment, Review, TripMilestone
from . import currency as currency_module
from . import mobile_numbers
from .outages import network_outage_message, payment_availability, record_attempt
from .payments import (
    close_payment,
    complete_payment,
    open_direct_payment,
    open_session,
    refresh_from_snippe,
    resend_prompt,
)
from .pricing import deposit_for, trip_total_for
from .serializers import (
    AdminBookingDetailSerializer,
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
logger = logging.getLogger(__name__)

INVOICE_DUE_DAYS = 14
# Snippe webhook event types acted on (SnippeWebhookView).
EVENT_PAYMENT_COMPLETED = "payment.completed"
EVENT_PAYMENT_FAILED = "payment.failed"


NO_REFERRAL = (None, None, None)
# A second click on Pay within this long reuses the prompt already sent to that phone
# (the tourist can ask for it again with "Resend") instead of sending another payment.
DIRECT_PAYMENT_REUSE_MINUTES = 10


def _provider_unreachable():
    return Response(
        {"detail": "We couldn't reach the payment provider. Please try again in a moment."},
        status=status.HTTP_502_BAD_GATEWAY,
    )


def _referral_terms(code_value, user):
    """(code, discount %, commission %) for a code entered at checkout, at today's
    referral settings; None if it can't be used. exclude(agent=...): an agent can also
    book, and must not collect commission on their own trip — the validate endpoint
    refuses that at checkout, this is the backstop. The code is only marked used once
    the payment completes (complete_payment re-checks it under a lock), so an abandoned
    checkout doesn't burn it."""
    code = ReferralCode.objects.filter(code=code_value, is_used=False).exclude(agent=user).first()
    if code is None or code.is_expired:
        return None
    settings_obj = ReferralSettings.get_solo()
    return code, settings_obj.discount_percent, settings_obj.commission_percent


def _carried_over_referral_terms(booking, user):
    """A retry (My Trips' "Pay Deposit", after the first attempt failed or was abandoned)
    sends no code. Carry over the one from this booking's earlier attempt, on the terms it
    was opened with, so a failed payment doesn't cost the tourist their discount or the
    agent their commission — or NO_REFERRAL if the code has since been used or expired."""
    previous = (
        Payment.objects.filter(booking=booking, kind=Payment.KIND_DEPOSIT, referral_code__isnull=False)
        .select_related("referral_code")
        .first()
    )
    code = previous.referral_code if previous else None
    if not code or code.is_used or code.is_expired or code.agent_id == user.id:
        return NO_REFERRAL
    return code, previous.discount_percent, previous.commission_percent


class BookingViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    throttle_scope = "booking_create"
    pagination_class = StandardPagination
    queryset = Booking.objects.select_related(
        "customer", "safari", "region_safari", "region_safari__region", "assigned_guide", "review", "invoice"
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
        if self.action in (
            "list", "retrieve", "milestones", "complete_milestone", "review", "pay", "pay_balance", "payment_status",
            "resend_prompt",
        ):
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_serializer_class(self):
        if self.action == "list":
            return BookingListSerializer
        if self.action == "create":
            return BookingCreateSerializer
        return self._detail_serializer_class()

    def _detail_serializer_class(self):
        # Only admins get the internal notes thread; a booking's tourist and guide
        # see everything else.
        if getattr(self.request.user, "role", None) == User.ROLE_ADMIN:
            return AdminBookingDetailSerializer
        return BookingDetailSerializer

    def _detail(self, booking):
        return self._detail_serializer_class()(booking).data

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
        return Response(self._detail(booking), status=status.HTTP_201_CREATED)

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
        return Response(self._detail(instance))

    @action(detail=True, methods=["patch"], url_path="quote")
    def quote(self, request, pk=None):
        booking = self.get_object()
        if booking.stage not in (Booking.STAGE_NEW_INQUIRY, Booking.STAGE_QUOTED):
            # Money has changed hands against the current quote; rewriting it now would
            # leave the invoice and what was paid disagreeing with the line items.
            return Response(
                {"detail": "This booking has already moved past the quoting stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = QuoteUpdateSerializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self._detail(booking))

    @action(detail=True, methods=["post"], url_path="notes")
    def notes(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingNoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        BookingNote.objects.create(booking=booking, author=request.user, text=serializer.validated_data["text"])
        booking.refresh_from_db()
        return Response(self._detail(booking), status=status.HTTP_201_CREATED)

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
            invoice, created = Invoice.objects.get_or_create(
                booking=booking,
                defaults={
                    "amount": booking.subtotal,
                    "due_date": timezone.localdate() + timedelta(days=INVOICE_DUE_DAYS),
                },
            )
            # A re-sent quote bills what the email now says, as long as nothing has been
            # paid against the earlier figure.
            if not created and invoice.status == Invoice.STATUS_UNPAID and invoice.amount != booking.subtotal:
                invoice.amount = booking.subtotal
                invoice.save(update_fields=["amount"])
        send_notification(
            subject=f"Your SafariQuest quote — {booking.package_title}",
            message=(
                f"Hi {booking.customer.name or booking.customer.email},\n\n"
                f"Your quote for {booking.package_title} is ready: "
                f"{currency_module.format_amount(booking.subtotal, booking.currency)}. "
                "Please reply to confirm or ask any questions."
            ),
            recipient_list=[booking.customer.email],
        )
        log_action(request.user, "booking.quote_sent", f"Sent quote for booking #{booking.id} ({currency_module.format_amount(booking.subtotal, booking.currency)})")
        return Response(self._detail(booking))

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
        return Response(self._detail(booking))

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
        try:
            with transaction.atomic():
                review = Review.objects.create(
                    booking=booking, guide=booking.assigned_guide, **serializer.validated_data
                )
                if review.guide_id:
                    review.guide.recompute_rating()
        except IntegrityError:
            # A double-submitted review: both passed the check above, and the
            # one-to-one constraint stopped the second.
            return Response(
                {"detail": "This booking has already been reviewed."}, status=status.HTTP_400_BAD_REQUEST
            )
        booking.refresh_from_db()
        return Response(self._detail(booking), status=status.HTTP_201_CREATED)

    def _open_payment(self, booking, locale, phone_number, **fields):
        """Returns a pending Payment on Snippe for these exact terms: the one already open
        if the tourist clicked pay twice (or, hosted, came back from Snippe's page without
        paying), otherwise a new one — a fresh phone prompt (direct) or checkout session
        (hosted). A direct payment is reused only briefly: after that a click means the
        tourist wants a new prompt."""
        if settings.SNIPPE_CHECKOUT_MODE == "direct":
            mode, fresh_for = Payment.MODE_DIRECT, timedelta(minutes=DIRECT_PAYMENT_REUSE_MINUTES)
            fields["phone_number"] = phone_number
        else:
            mode, fresh_for = Payment.MODE_HOSTED, timedelta(seconds=settings.SNIPPE_SESSION_EXPIRES_IN - 300)
        existing = (
            Payment.objects.filter(
                booking=booking,
                mode=mode,
                status=Payment.STATUS_PENDING,
                created_at__gte=timezone.now() - fresh_for,
                **fields,
            )
            .exclude(session_reference=None)
            .first()
        )
        if existing:
            return existing
        payment = Payment.objects.create(
            booking=booking,
            mode=mode,
            currency=booking.currency,
            provider=currency_module.PROVIDER_FOR[booking.currency],
            **fields,
        )
        if mode == Payment.MODE_DIRECT:
            return open_direct_payment(payment)
        return open_session(payment, locale)

    def _direct_phone(self, request, booking, raw_phone):
        """(normalized number, None) for direct payments, or (None, an error Response):
        not a Tanzanian mobile number, a network Snippe doesn't take, or a network that's
        down right now. (None, None) in hosted mode, where Snippe's page asks for it."""
        if settings.SNIPPE_CHECKOUT_MODE != "direct":
            return None, None
        msisdn = mobile_numbers.normalize(raw_phone)
        if msisdn is None:
            return None, Response(
                {"detail": "Enter a Tanzanian mobile number, e.g. 0754 123 456.", "code": "invalid_phone"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        channel = mobile_numbers.network_for(msisdn)
        if channel is None:
            return None, Response(
                {"detail": "Use an M-Pesa, Airtel Money, Mixx by Yas or Halotel number.", "code": "unsupported_network"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = network_outage_message(channel)
        if message:
            log_action(
                request.user,
                "booking.payment_blocked_outage",
                f"Payment for booking #{booking.id} refused: {message}"[:500],
            )
            return None, Response(
                {"detail": message, "code": "network_outage"}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return msisdn, None

    def _outage_refusal(self, request, booking):
        """A 503 with the outage message while Snippe can't take payments at all — rather
        than sending the tourist to a checkout that will fail. Logged, so there's a record
        of who was turned away and when."""
        availability = payment_availability()
        if not availability["blocked"]:
            return None
        logger.warning("Refused payment for booking %s: %s", booking.id, availability["message"])
        log_action(
            request.user,
            "booking.payment_blocked_outage",
            f"Payment for booking #{booking.id} refused during a Snippe outage: {availability['message']}"[:500],
        )
        return Response(
            {"detail": availability["message"], "code": "payment_outage"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    def _payment_gate(self, request, booking):
        """Everything a pay request must pass before a provider is called — the booking's
        currency payable online, Snippe configured and not down entirely, a valid body, and
        (direct) a usable phone number. Returns (validated data, normalized phone or None,
        None), or (None, None, a refusal)."""
        if booking.currency != currency_module.TZS:
            # USD goes to Senjaropay, which isn't connected yet.
            return None, None, Response(
                {
                    "detail": "USD card payments will be enabled soon. To pay now, book in TZS (mobile money) or contact us.",
                    "code": "provider_unavailable",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not snippe.is_configured():
            return None, None, Response(
                {"detail": "Online payment isn't available right now. Please contact us to pay."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        refusal = self._outage_refusal(request, booking)
        if refusal:
            return None, None, refusal
        serializer = BookingPaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number, refusal = self._direct_phone(request, booking, serializer.validated_data.get("phone_number"))
        if refusal:
            return None, None, refusal
        return serializer.validated_data, phone_number, None

    def _checkout_response(self, payment):
        """Direct: the page shows "approve the prompt on 0754 *** 456" and polls. Hosted: the
        browser goes to `checkout_url`."""
        return Response(
            {
                "payment_id": payment.id,
                "mode": payment.mode,
                "checkout_url": payment.checkout_url,
                "phone_masked": mobile_numbers.masked(payment.phone_number) if payment.phone_number else "",
                "amount": payment.amount,
                "currency": payment.currency,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        """Starts the deposit payment (1.3): a prompt to the tourist's phone (direct) or a
        Snippe checkout session to send them to (hosted). Nothing about the booking changes
        here — bookings.payments.complete_payment does that once Snippe confirms.

        The trip total and deposit are computed here (bookings.pricing), from the same
        package price, season and guest counts the checkout page priced from — never
        taken from the request, or anyone could set their own price and an agent's
        commission along with it."""
        booking = self.get_object()
        if request.user.role != User.ROLE_TOURIST or booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if booking.stage != Booking.STAGE_NEW_INQUIRY or Invoice.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST
            )
        data, phone_number, refusal = self._payment_gate(request, booking)
        if refusal:
            return refusal
        referral_code_value = (data.get("referral_code") or "").strip().upper()
        if referral_code_value:
            terms = _referral_terms(referral_code_value, request.user)
            if terms is None:
                # The page priced the trip with this code's discount. Charging full
                # price instead would record a different amount than the tourist
                # agreed to, so refuse and let them pay again without the code.
                return Response(
                    {"detail": "This referral code can no longer be used. Remove it and try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            terms = _carried_over_referral_terms(booking, request.user)
        referral_code, discount_percent, commission_percent = terms

        trip_total = trip_total_for(booking, discount_percent)
        try:
            payment = self._open_payment(
                booking,
                data.get("locale"),
                phone_number,
                kind=Payment.KIND_DEPOSIT,
                amount=deposit_for(trip_total),
                trip_total=trip_total,
                referral_code=referral_code,
                discount_percent=discount_percent,
                commission_percent=commission_percent,
            )
        except snippe.SnippeError:
            logger.exception("Could not open a Snippe deposit payment for booking %s", booking.id)
            return _provider_unreachable()
        return self._checkout_response(payment)

    @action(detail=True, methods=["post"], url_path="pay-balance")
    def pay_balance(self, request, pk=None):
        """Starts a payment for whatever remains after the deposit, from the tourist's own
        dashboard — direct or hosted, as for the deposit. The amount is computed here from the invoice's trip_total
        rather than trusted from the client."""
        booking = self.get_object()
        if request.user.role != User.ROLE_TOURIST or booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        invoice = Invoice.objects.filter(booking=booking).first()
        if not invoice or invoice.trip_total is None:
            return Response({"detail": "No balance is due on this booking."}, status=status.HTTP_400_BAD_REQUEST)
        remaining = invoice.remaining_balance
        if not remaining:
            return Response({"detail": "This booking is already fully paid."}, status=status.HTTP_400_BAD_REQUEST)
        data, phone_number, refusal = self._payment_gate(request, booking)
        if refusal:
            return refusal
        try:
            payment = self._open_payment(
                booking, data.get("locale"), phone_number, kind=Payment.KIND_BALANCE, amount=remaining
            )
        except snippe.SnippeError:
            logger.exception("Could not open a Snippe balance payment for booking %s", booking.id)
            return _provider_unreachable()
        return self._checkout_response(payment)

    @action(detail=True, methods=["get"], url_path=r"payments/(?P<payment_id>\d+)")
    def payment_status(self, request, pk=None, payment_id=None):
        """Where a payment stands, for the page Snippe sends the tourist back to. A payment
        still pending here is checked against Snippe's API, so the page doesn't depend on
        the webhook having arrived first."""
        booking = self.get_object()
        if booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        payment = Payment.objects.filter(booking=booking, pk=payment_id).first()
        if payment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        payment = refresh_from_snippe(payment)
        return Response(
            {
                "payment_id": payment.id,
                "kind": payment.kind,
                "mode": payment.mode,
                "status": payment.status,
                "amount": payment.amount,
                "currency": payment.currency,
                "phone_masked": mobile_numbers.masked(payment.phone_number) if payment.phone_number else "",
                "customer_email": booking.customer.email,
                "package_title": booking.package_title,
            }
        )

    @action(detail=True, methods=["post"], url_path=r"payments/(?P<payment_id>\d+)/resend")
    def resend_prompt(self, request, pk=None, payment_id=None):
        """Sends a pending direct payment's prompt to the phone again — for a prompt that
        timed out on the handset or was dismissed by accident."""
        booking = self.get_object()
        if booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        payment = Payment.objects.filter(
            booking=booking, pk=payment_id, mode=Payment.MODE_DIRECT, status=Payment.STATUS_PENDING
        ).first()
        if payment is None or not payment.session_reference:
            return Response(
                {"detail": "This payment can't be resent. Start a new payment instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            resend_prompt(payment)
        except snippe.SnippeError:
            logger.exception("Could not resend the Snippe prompt for payment %s", payment.id)
            return _provider_unreachable()
        return Response({"payment_id": payment.id, "phone_masked": mobile_numbers.masked(payment.phone_number)})


class PaymentAvailabilityView(APIView):
    """Whether online payment works right now, for the checkout pages to show before the
    tourist clicks pay: `blocked` (with `message`) while Snippe is down entirely, and
    `warnings` for a single network being out (bookings.outages)."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                **payment_availability(),
                "mode": settings.SNIPPE_CHECKOUT_MODE,
                # Which currencies can be paid online right now. USD needs Senjaropay,
                # which isn't connected yet.
                "currencies": {currency_module.TZS: snippe.is_configured(), currency_module.USD: False},
            }
        )


class SnippeWebhookView(APIView):
    """Receives Snippe's payment events. No session or JWT auth — the request is trusted
    only once its X-Webhook-Signature checks out against SNIPPE_WEBHOOK_SECRET.

    Unknown or unmatched events still get a 200: a non-2xx makes Snippe retry for the
    next ~45 minutes, which only helps when retrying could succeed."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request):
        raw_body = request.body
        if not snippe.verify_webhook(
            raw_body,
            request.headers.get("X-Webhook-Timestamp", ""),
            request.headers.get("X-Webhook-Signature", ""),
        ):
            logger.warning("Rejected a Snippe webhook with a missing or invalid signature")
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            event = json.loads(raw_body)
        except ValueError:
            return Response({"detail": "Invalid JSON."}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("type") or event.get("event")
        data = event.get("data") or {}
        payment = self._payment_for(data)
        if payment is None:
            logger.warning("Snippe webhook %s (%s) matched no payment", event.get("id"), event_type)
            return Response({"received": True})

        if event_type == EVENT_PAYMENT_COMPLETED:
            amount = data.get("amount") or {}
            complete_payment(
                payment,
                amount=amount.get("value"),
                currency=amount.get("currency"),
                provider_reference=data.get("reference") or "",
            )
        elif event_type in (EVENT_PAYMENT_FAILED, "payment.voided"):
            close_payment(payment, Payment.STATUS_FAILED)
        elif event_type == "payment.expired":
            close_payment(payment, Payment.STATUS_EXPIRED)

        if event_type in (EVENT_PAYMENT_COMPLETED, EVENT_PAYMENT_FAILED):
            self._record_attempt(event, payment, data, succeeded=event_type == EVENT_PAYMENT_COMPLETED)
        return Response({"received": True})

    @staticmethod
    def _record_attempt(event, payment, data, *, succeeded):
        """Feeds outage detection. A direct payment is a single attempt, which the status
        check may already have recorded if it got there before this webhook."""
        if payment.mode == Payment.MODE_DIRECT and payment.attempts.exists():
            return
        try:
            record_attempt(event_id=event.get("id"), payment=payment, data=data, succeeded=succeeded)
        except Exception:
            # Outage detection is a side job: it must never make Snippe retry a payment
            # event that was otherwise handled.
            logger.exception("Could not record payment attempt for event %s", event.get("id"))

    @staticmethod
    def _payment_for(data):
        # Hosted: `session_reference` is ours. Direct: the payment's own `reference` is.
        for reference in (data.get("session_reference"), data.get("reference")):
            if reference:
                payment = Payment.objects.filter(session_reference=reference).first()
                if payment:
                    return payment
        metadata = data.get("metadata") or {}
        payment_id = str(metadata.get("payment_id") or "")
        if payment_id.isdigit():
            return Payment.objects.filter(pk=int(payment_id)).first()
        return None


class InvoiceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Invoices are issued automatically when a quote is sent (2.2) or a checkout deposit is
    paid through Snippe (1.3, bookings.payments) — there's no create endpoint here. Admin can
    still set status by hand, e.g. for a payment taken outside Snippe."""

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
        log_action(request.user, "invoice.reminder_sent", f"Sent a payment reminder for invoice #{invoice.id}")
        send_notification(
            subject=f"Payment reminder — {invoice.booking.package_title}",
            message=(
                f"Hi {invoice.booking.customer.name or invoice.booking.customer.email},\n\n"
                f"This is a reminder that {currency_module.format_amount(invoice.amount, invoice.booking.currency)} "
                f"is due by {invoice.due_date} for "
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
        #
        # A checkout invoice bills the whole trip (trip_total) and has collected its
        # deposit (amount) until the balance is paid; a quote invoice bills `amount`
        # and has collected nothing until it's marked paid. Counting only `amount`
        # and only paid invoices used to under-report what's billed and report every
        # deposit already received as outstanding.
        billed = Coalesce("trip_total", "amount")
        collected = Case(
            When(status=Invoice.STATUS_PAID, then=billed),
            When(status=Invoice.STATUS_DEPOSIT_PAID, trip_total__isnull=False, then=F("amount")),
            default=Value(0),
            output_field=IntegerField(),
        )
        invoices = Invoice.objects.with_effective_status().annotate(billed=billed, collected=collected)
        # Money is only ever added up within one currency: TZS and USD figures each get
        # their own totals. The overdue count is just a count, so it spans both.
        by_currency = {}
        for code in currency_module.CURRENCIES:
            mine = invoices.filter(booking__currency=code)
            totals = mine.aggregate(billed_total=Sum("billed"), collected_total=Sum("collected"))
            owed = mine.filter(effective_status_db="overdue").aggregate(owed=Sum(F("billed") - F("collected")))
            total_invoiced = totals["billed_total"] or 0
            total_collected = totals["collected_total"] or 0
            by_currency[code] = {
                "total_invoiced": total_invoiced,
                "total_collected": total_collected,
                "total_outstanding": total_invoiced - total_collected,
                "overdue_amount": owed["owed"] or 0,
            }
        return Response(
            {
                "by_currency": by_currency,
                "overdue_count": invoices.filter(effective_status_db="overdue").count(),
            }
        )
