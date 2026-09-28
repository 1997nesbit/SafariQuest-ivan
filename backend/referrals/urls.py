from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminReferralRedemptionViewSet,
    ReferralAgentActivateView,
    ReferralAgentRegisterView,
    ReferralCodeValidateView,
    ReferralCodeViewSet,
    ReferralSettingsAdminView,
    ReferralSettingsPublicView,
)

router = DefaultRouter()
router.register("codes", ReferralCodeViewSet, basename="referral-code")
router.register("admin/redemptions", AdminReferralRedemptionViewSet, basename="admin-referral-redemption")

urlpatterns = [
    path("agents/register/", ReferralAgentRegisterView.as_view(), name="referral-agent-register"),
    path("agents/activate/", ReferralAgentActivateView.as_view(), name="referral-agent-activate"),
    path("codes/validate/", ReferralCodeValidateView.as_view(), name="referral-code-validate"),
    path("settings/public/", ReferralSettingsPublicView.as_view(), name="referral-settings-public"),
    path("settings/", ReferralSettingsAdminView.as_view(), name="referral-settings-admin"),
] + router.urls
