from rest_framework import viewsets

from accounts.permissions import IsAdminRole

from .models import Guide
from .serializers import GuideSerializer


class GuideViewSet(viewsets.ModelViewSet):
    queryset = Guide.objects.all().order_by("name")
    serializer_class = GuideSerializer
    permission_classes = [IsAdminRole]
