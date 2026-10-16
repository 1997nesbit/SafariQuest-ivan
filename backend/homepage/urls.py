from rest_framework.routers import DefaultRouter

from .views import HomepageImageViewSet, PartnerHotelViewSet

router = DefaultRouter()
router.register("images", HomepageImageViewSet, basename="homepage-image")
router.register("partner-hotels", PartnerHotelViewSet, basename="partner-hotel")

urlpatterns = router.urls
