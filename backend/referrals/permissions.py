from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

User = get_user_model()


class IsReferralAgentRole(BasePermission):
    """A tourist account with the agent profile switched on (User.is_referral_agent)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.role == User.ROLE_TOURIST and user.is_referral_agent
        )
