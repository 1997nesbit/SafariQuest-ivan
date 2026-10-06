from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import Promotion
from .serializers import PromotionSerializer


class PromotionViewSet(viewsets.ModelViewSet):
    """Public read, admin write.

    Visitors see only published events. Admins see the same list by default, and
    `?all=true` adds unpublished ones for the content manager.
    """

    serializer_class = PromotionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_authenticated and user.role == user.ROLE_ADMIN
        if not is_admin or (self.action == "list" and self.request.query_params.get("all") != "true"):
            return Promotion.objects.live()
        return Promotion.objects.all()
