from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdminRole
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    SetPasswordSerializer,
    UserInviteSerializer,
    UserListSerializer,
)

User = get_user_model()


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
    authentication_classes = []
    permission_classes = [AllowAny]

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


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw_refresh:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(raw_refresh)
        except TokenError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        access = refresh.access_token
        response = Response(status=status.HTTP_200_OK)
        response.set_cookie(
            settings.AUTH_COOKIE_ACCESS,
            str(access),
            max_age=int(access.lifetime.total_seconds()),
            httponly=True,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )
        return response


STAFF_ROLES = ("sales", "operations", "guide", "admin")


class UserInviteView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.filter(role__in=STAFF_ROLES).order_by("name")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserInviteSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        set_password_url = f"{settings.FRONTEND_URL}/set-password?uid={uid}&token={token}"
        send_mail(
            subject="You've been invited to SafariQuest",
            message=(
                f"Hi {user.name or user.email},\n\n"
                f"You've been invited to join SafariQuest as {user.get_role_display()}. "
                f"Set your password to get started: {set_password_url}"
            ),
            from_email=None,
            recipient_list=[user.email],
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"role": request.user.role}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        response = Response({"role": user.role}, status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, user)
        return response


class SetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid or expired link."}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["password"])
        user.save()
        response = Response({"role": user.role}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, user)
        return response
