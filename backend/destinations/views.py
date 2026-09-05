from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import Destination
from .serializers import DestinationSerializer


class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all().prefetch_related("experiences")
    serializer_class = DestinationSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
