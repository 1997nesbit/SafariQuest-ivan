from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import Destination, Park
from .serializers import DestinationSerializer, ParkSerializer


class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all().prefetch_related("experiences")
    serializer_class = DestinationSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"


class ParkViewSet(viewsets.ModelViewSet):
    queryset = Park.objects.all().select_related("region")
    serializer_class = ParkSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
