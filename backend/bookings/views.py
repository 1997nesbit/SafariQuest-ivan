from rest_framework import mixins, viewsets
from rest_framework.response import Response

from accounts.permissions import IsBookingStaffRole

from .models import Booking
from .serializers import BookingDetailSerializer, BookingListSerializer, BookingUpdateSerializer


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
