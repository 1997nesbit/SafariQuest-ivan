from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/users/", include("accounts.user_urls")),
    path("api/destinations/", include("destinations.urls")),
    path("api/parks/", include("destinations.park_urls")),
    path("api/safaris/", include("safaris.urls")),
    path("api/pricing/", include("pricing.urls")),
    path("api/guides/", include("guides.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/uploads/", include("uploads.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
