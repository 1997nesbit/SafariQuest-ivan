from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdminRole
from .serializers import LoginSerializer, UserInviteSerializer


def _set_auth_cookies(response, user):
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    response.set_cookie(
        settings.AUTH_COOKIE_ACCESS,
        str(access),
        max_age=int(access.lifetime.total_seconds()),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.set_cookie(
        settings.AUTH_COOKIE_REFRESH,
        str(refresh),
        max_age=int(refresh.lifetime.total_seconds()),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    return refresh


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        user = serializer.validated_data["user"]
        response = Response({"role": user.role}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, user)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        response = Response(status=status.HTTP_200_OK)
        blacklisted = False
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
                blacklisted = True
            except TokenError:
                blacklisted = False
        response.delete_cookie(settings.AUTH_COOKIE_ACCESS)
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH)
        if not blacklisted:
            response.status_code = status.HTTP_401_UNAUTHORIZED
        return response


class UserInviteView(generics.CreateAPIView):
    serializer_class = UserInviteSerializer
    permission_classes = [IsAdminRole]

    def perform_create(self, serializer):
        user = serializer.save()
        send_mail(
            subject="You've been invited to SafariQuest",
            message=(
                f"Hi {user.name or user.email},\n\n"
                f"You've been invited to join SafariQuest as {user.get_role_display()}. "
                "Sign in and set your password to get started."
            ),
            from_email=None,
            recipient_list=[user.email],
        )
