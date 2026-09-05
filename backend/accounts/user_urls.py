from django.urls import path

from .views import UserInviteView

urlpatterns = [
    path("", UserInviteView.as_view(), name="invite-user"),
]
