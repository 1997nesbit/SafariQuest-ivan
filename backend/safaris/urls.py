from rest_framework.routers import DefaultRouter

from .views import SafariPackageViewSet

router = DefaultRouter()
router.register("", SafariPackageViewSet, basename="safari")

urlpatterns = router.urls
