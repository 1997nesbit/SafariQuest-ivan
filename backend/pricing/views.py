from rest_framework import viewsets

from accounts.permissions import IsAdminRole

from .models import Season
from .serializers import SeasonSerializer


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by("start_date")
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminRole]
