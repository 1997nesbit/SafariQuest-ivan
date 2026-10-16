from django.urls import path

from .views import ImageUploadView, VideoUploadView

urlpatterns = [
    path("images/", ImageUploadView.as_view(), name="image-upload"),
    path("videos/", VideoUploadView.as_view(), name="video-upload"),
]
