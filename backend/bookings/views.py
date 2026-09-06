from django.core.mail import send_mail
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsBookingStaffRole

from .models import Booking, BookingNote
from .serializers import (
    BookingDetailSerializer,
    BookingListSerializer,
    BookingNoteInputSerializer,
    BookingUpdateSerializer,
    QuoteUpdateSerializer,
)


class BookingViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsBookingStaffRole]
    queryset = Booking.objects.select_related("customer", "safari", "assigned_guide").prefetch_related(
        "line_items", "notes"
    )

    def get_serializer_class(self):
        if self.action == "list":
            return BookingListSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        stage = self.request.query_params.get("stage")
        if stage:
            queryset = queryset.filter(stage=stage)
        region = self.request.query_params.get("region")
        if region:
            queryset = queryset.filter(safari__destination=region)
        guide = self.request.query_params.get("guide")
        if guide == "unassigned":
            queryset = queryset.filter(assigned_guide__isnull=True)
        elif guide:
            queryset = queryset.filter(assigned_guide_id=guide)
        return queryset

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        serializer = BookingUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
        booking.stage = Booking.STAGE_QUOTED
        booking.save(update_fields=["stage"])
        send_mail(
            subject=f"Your SafariQuest quote — {booking.safari.title}",
            message=(
                f"Hi {booking.customer.name or booking.customer.email},\n\n"
                f"Your quote for {booking.safari.title} is ready: ${booking.subtotal:,}. "
                "Please reply to confirm or ask any questions."
            ),
            from_email=None,
            recipient_list=[booking.customer.email],
        )
        return Response(BookingDetailSerializer(booking).data)
