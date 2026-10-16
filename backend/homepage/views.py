from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from accounts.permissions import IsAdminOrReadOnly

from .models import HOMEPAGE_SLOTS, HomepageImage, PartnerHotel
from .serializers import HomepageImageSerializer, PartnerHotelSerializer

_VALID_SLOTS = {slot for slot, _ in HOMEPAGE_SLOTS}


class HomepageImageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """The site's fixed photo spots. List/retrieve are public; only an admin can
    change one, and only its image/alt — see HomepageImageSerializer. The set of
    spots is fixed in code (HOMEPAGE_SLOTS), so there's no create endpoint.
    Deleting a spot's row is "reset to original": the site goes back to its
    built-in default for that spot (for the hero video, the video that ships
    with the site).

    Updating a known spot that has no row yet creates it. Spots get added as more
    pages become editable; without this, each new spot would 404 in the content
    manager until someone remembered to run `seed_homepage_images` on the server.
    """

    queryset = HomepageImage.objects.all()
    serializer_class = HomepageImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slot"

    def update(self, request, *args, **kwargs):
        slot = kwargs[self.lookup_field]
        if slot not in _VALID_SLOTS:
            raise NotFound("Unknown photo spot.")
        instance = HomepageImage.objects.filter(slot=slot).first()
        if instance is not None:
            return super().update(request, *args, **kwargs)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(slot=slot)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PartnerHotelViewSet(viewsets.ModelViewSet):
    """Public read, admin write, with the same visibility rule as the other
    content lists: visitors only see published hotels; `?all=true` adds hidden
    ones for an admin in the content manager.
    """

    serializer_class = PartnerHotelSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = PartnerHotel.objects.all()
        user = self.request.user
        is_admin = user.is_authenticated and user.role == user.ROLE_ADMIN
        if not is_admin or (self.action == "list" and self.request.query_params.get("all") != "true"):
            return queryset.filter(is_published=True)
        return queryset
