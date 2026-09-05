from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import SafariPackage
from .serializers import SafariPackageSerializer


class SafariPackageViewSet(viewsets.ModelViewSet):
    queryset = SafariPackage.objects.all().prefetch_related("itinerary")
    serializer_class = SafariPackageSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
