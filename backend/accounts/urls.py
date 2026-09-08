from django.urls import path

from .views import LoginView, LogoutView, MeView, RefreshView, RegisterView, SetPasswordView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("register/", RegisterView.as_view(), name="register"),
    path("set-password/", SetPasswordView.as_view(), name="set-password"),
]
