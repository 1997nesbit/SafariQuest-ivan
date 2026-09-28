from django.contrib.auth import get_user_model
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from accounts.views import _set_auth_cookies, auth_payload

from .models import ReferralCode, ReferralRedemption, ReferralSettings
from .permissions import IsReferralAgentRole
from .serializers import (
    AdminReferralRedemptionSerializer,
    ReferralAgentRegisterSerializer,
    ReferralCodeCreateSerializer,
    ReferralCodeSerializer,
    ReferralCodeValidateSerializer,
    ReferralSettingsPublicSerializer,
    ReferralSettingsSerializer,
)

User = get_user_model()


class ReferralAgentRegisterView(APIView):
    """Creates a new tourist account with the agent profile already on. For people who
    don't have an account yet — existing users use ReferralAgentActivateView."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = ReferralAgentRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        response = Response(auth_payload(user), status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, user)
        return response


class ReferralAgentActivateView(APIView):
    """Switches the agent profile on for the signed-in tourist, so a traveller can refer
    friends with the same login they booked with. Calling it again is harmless."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.ROLE_TOURIST:
            return Response(
                {"detail": "Staff and guide accounts can't become referral agents."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.is_referral_agent:
            user.is_referral_agent = True
            user.save(update_fields=["is_referral_agent"])
        return Response(auth_payload(user), status=status.HTTP_200_OK)


class ReferralCodeViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReferralCodeSerializer
    queryset = ReferralCode.objects.select_related("agent").prefetch_related("redemptions")

    def get_permissions(self):
        return [IsReferralAgentRole()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReferralCodeCreateSerializer
        return ReferralCodeSerializer

    def get_queryset(self):
        return super().get_queryset().filter(agent=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.save()
        return Response(ReferralCodeSerializer(code).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        codes = self.get_queryset()
        return Response(ReferralCodeSerializer(codes, many=True).data)


class ReferralCodeValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReferralCodeValidateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj = ReferralSettings.get_solo()
        return Response({"discountPercent": str(settings_obj.discount_percent)})


class ReferralSettingsPublicView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ReferralSettingsPublicSerializer

    def get_object(self):
        return ReferralSettings.get_solo()


class ReferralSettingsAdminView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ReferralSettingsSerializer

    def get_object(self):
        return ReferralSettings.get_solo()


class AdminReferralRedemptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminReferralRedemptionSerializer
    queryset = ReferralRedemption.objects.select_related("code__agent", "booking__customer").order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        redemption = self.get_object()
        redemption.commission_status = ReferralRedemption.STATUS_PAID
        redemption.save(update_fields=["commission_status"])
        return Response(AdminReferralRedemptionSerializer(redemption).data)
