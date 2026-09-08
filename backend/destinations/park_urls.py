from rest_framework.routers import DefaultRouter

from .views import ParkViewSet

router = DefaultRouter()
router.register("", ParkViewSet, basename="park")

urlpatterns = router.urls
