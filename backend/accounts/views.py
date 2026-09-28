from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from audit.utils import log_action
from config.pagination import StandardPagination
from config.mail import send_notification

from .permissions import IsAdminRole
from .serializers import (
    ChangePasswordSerializer,
    CustomerDetailSerializer,
    CustomerSerializer,
    LoginSerializer,
    RegisterSerializer,
    SetPasswordSerializer,
    UserActiveUpdateSerializer,
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


def auth_payload(user) -> dict:
    """What every sign-in-shaped response tells the frontend about the user.

    `home` is decided here rather than in the SPA because it depends on whether the user
    has any bookings (see User.home_path), which the frontend doesn't know at sign-in.
    """
    return {"role": user.role, "is_referral_agent": user.is_referral_agent, "home": user.home_path}


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        user = serializer.validated_data["user"]
        response = Response(auth_payload(user), status=status.HTTP_200_OK)
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


class UserInviteView(generics.ListCreateAPIView):
    """Lists and invites Administrator accounts. Guides have their own roster (guides app) and
    are created with an account together via guides.GuideCreateWithAccountView."""

    permission_classes = [IsAdminRole]
    queryset = User.objects.filter(role=User.ROLE_ADMIN).order_by("name")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserInviteSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        set_password_url = f"{settings.FRONTEND_URL}/set-password?uid={uid}&token={token}"
        send_notification(
            subject="You've been invited to SafariQuest",
            message=(
                f"Hi {user.name or user.email},\n\n"
                f"You've been invited to join SafariQuest as {user.get_role_display()}. "
                f"Set your password to get started: {set_password_url}"
            ),
            recipient_list=[user.email],
        )
        log_action(self.request.user, "user.invited", f"Invited {user.email} as Administrator")


class UserDetailView(generics.UpdateAPIView):
    """Activates/deactivates an Administrator account (9.2). Role can't be changed here — each
    role has its own creation flow with role-specific setup (Guides via Staff & Guides, Tourists
    via self-registration) — so this endpoint intentionally only controls whether an existing
    admin account can sign in."""

    permission_classes = [IsAdminRole]
    serializer_class = UserActiveUpdateSerializer
    queryset = User.objects.filter(role=User.ROLE_ADMIN)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user and request.data.get("is_active") is False:
            return Response(
                {"detail": "You can't deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST
            )
        super().partial_update(request, *args, **kwargs)
        instance.refresh_from_db()
        action = "user.activated" if instance.is_active else "user.deactivated"
        log_action(request.user, action, f"{'Activated' if instance.is_active else 'Deactivated'} {instance.email}")
        return Response(UserListSerializer(instance).data)


class CustomerListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = CustomerSerializer
    pagination_class = StandardPagination
    queryset = User.objects.filter(role=User.ROLE_TOURIST).prefetch_related("bookings", "bookings__line_items").order_by(
        "-date_joined"
    )


class CustomerDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = CustomerDetailSerializer
    queryset = User.objects.filter(role=User.ROLE_TOURIST).prefetch_related(
        "bookings", "bookings__line_items", "bookings__safari", "bookings__assigned_guide", "bookings__invoice"
    )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {**auth_payload(user), "name": user.name, "email": user.email},
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        response = Response(auth_payload(user), status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, user)
        return response


class SetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            if "password" in serializer.errors:
                return Response(
                    {"detail": str(serializer.errors["password"][0])},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({"detail": "Invalid or expired link."}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["password"])
        user.save()
        response = Response(auth_payload(user), status=status.HTTP_200_OK)
        _set_auth_cookies(response, user)
        return response


class CsrfTokenView(APIView):
    """Hands the caller a CSRF token for use in the X-CSRFToken header.

    The token cannot simply be read from the csrftoken cookie by the frontend:
    the SPA is served from a different origin than this API, and document.cookie
    only exposes cookies belonging to the reading document's own origin. The
    cookie is still set on this response and still travels back to us on
    subsequent requests, so Django's header-vs-cookie comparison works — the
    frontend just needs to be told the value rather than reading it.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)}, status=status.HTTP_200_OK)
