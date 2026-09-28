from django.contrib.auth import get_user_model
from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import TeamMember
from .serializers import TeamMemberSerializer

User = get_user_model()


class TeamMemberViewSet(viewsets.ModelViewSet):
    """Public read, admin write.

    Visitors only ever see published members. The list is published-only for
    admins too, unless they ask for `?all=true` — otherwise an admin browsing
    the public About page while logged in would see drafts that the rest of the
    world doesn't, and the content manager needs a way to list them anyway.
    Retrieve/update/delete reach unpublished rows for admins, so a draft can be
    edited before it goes live.
    """

    serializer_class = TeamMemberSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = TeamMember.objects.all()
        user = self.request.user
        is_admin = user.is_authenticated and user.role == User.ROLE_ADMIN
        if not is_admin:
            return queryset.filter(is_published=True)
        if self.action == "list" and self.request.query_params.get("all") != "true":
            return queryset.filter(is_published=True)
        return queryset
