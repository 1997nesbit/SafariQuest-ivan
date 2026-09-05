# Django Backend Part 0 (System Access & Setup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Django + DRF backend at `backend/` implementing cookie-based JWT sign in/out with role-based redirect (0.1, 0.2) and the First-Time Platform Setup CRUD endpoints for destinations, safaris, pricing seasons, guides, and admin-invited users (0.3).

**Architecture:** Django 5 project (`config/`) with five apps — `accounts` (custom User + auth), `destinations`, `safaris`, `pricing`, `guides`. JWTs are issued by `djangorestframework-simplejwt` but transported as HttpOnly cookies via a custom login/logout view pair and a custom `CookieJWTAuthentication` class, never in the JSON body. SQLite locally, Postgres in production via `DATABASE_URL`.

**Tech Stack:** Python 3.12, Django 5.x, djangorestframework, djangorestframework-simplejwt, django-cors-headers, dj-database-url, psycopg, python-dotenv.

## Global Constraints

- Backend lives in a new top-level `backend/` directory, sibling to `website/`.
- JWTs are never present in any JSON response body — only in HttpOnly cookies.
- `AUTH_USER_MODEL` uses email as the username field; role is one of `tourist | guide | sales | operations | admin`.
- `/api/pricing/seasons/`, `/api/guides/`, `/api/users/` writes are admin-only (`role == 'admin'`); `/api/destinations/` and `/api/safaris/` allow public reads, admin-only writes.
- No Google OAuth, no bookings/inquiries/invoicing — out of scope for this plan.
- Every app ships with `APITestCase` coverage before being considered done.

---

### Task 1: Project scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/manage.py`
- Create: `backend/config/__init__.py`
- Create: `backend/config/settings.py`
- Create: `backend/config/urls.py`
- Create: `backend/config/wsgi.py`
- Create: `backend/config/asgi.py`
- Create: `backend/.gitignore`

**Interfaces:**
- Produces: a runnable Django project with `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `AUTH_USER_MODEL = 'accounts.User'` (app added in Task 2), `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = ['accounts.authentication.CookieJWTAuthentication']` (class added in Task 3), CORS for `http://localhost:5173` with credentials.

- [ ] **Step 1: Create the virtualenv and requirements file**

```text
Django>=5.0,<5.1
djangorestframework>=3.15,<3.16
djangorestframework-simplejwt>=5.3,<5.4
django-cors-headers>=4.4,<4.5
dj-database-url>=2.2,<2.3
psycopg[binary]>=3.2,<3.3
python-dotenv>=1.0,<1.1
```

Save this as `backend/requirements.txt`.

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 2: Create `.env.example` and `.gitignore`**

`backend/.env.example`:

```env
DEBUG=True
SECRET_KEY=dev-secret-key-change-me
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

`backend/.gitignore`:

```gitignore
.venv/
__pycache__/
*.pyc
db.sqlite3
.env
```

- [ ] **Step 3: Scaffold the Django project**

```bash
cd backend
.venv/Scripts/django-admin startproject config .
```

This creates `manage.py`, `config/__init__.py`, `config/settings.py`, `config/urls.py`, `config/wsgi.py`, `config/asgi.py`.

- [ ] **Step 4: Edit `config/settings.py`**

Replace the generated file's contents with:

```python
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "accounts",
    "destinations",
    "safaris",
    "pricing",
    "guides",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.parse(
        os.environ.get("DATABASE_URL", "sqlite:///" + str(BASE_DIR / "db.sqlite3"))
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Dar_es_Salaam"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.CookieJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

AUTH_COOKIE_ACCESS = "access_token"
AUTH_COOKIE_REFRESH = "refresh_token"
AUTH_COOKIE_SECURE = not DEBUG
AUTH_COOKIE_SAMESITE = "Lax"

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

- [ ] **Step 5: Edit `config/urls.py`**

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/users/", include("accounts.user_urls")),
    path("api/destinations/", include("destinations.urls")),
    path("api/safaris/", include("safaris.urls")),
    path("api/pricing/", include("pricing.urls")),
    path("api/guides/", include("guides.urls")),
]
```

(The included `urls.py`/`user_urls.py`/etc. modules are created in later tasks — this file is finalized once every app exists, but written now so each later task only adds its own app's `urls.py`.)

- [ ] **Step 6: Verify the project boots**

```bash
cd backend
.venv/Scripts/python manage.py check
```

Expected: `ModuleNotFoundError` or `ImportError` for `accounts`, `destinations`, etc. (they don't exist yet) — this is expected at this point and resolved task-by-task. If instead you see an unrelated traceback (e.g. a settings syntax error), fix that now.

- [ ] **Step 7: Commit**

```bash
cd backend
git add requirements.txt .env.example .gitignore manage.py config/
git commit -m "chore: scaffold Django project for backend"
```

---

### Task 2: `accounts` app — custom User model

**Files:**
- Create: `backend/accounts/__init__.py`
- Create: `backend/accounts/apps.py`
- Create: `backend/accounts/managers.py`
- Create: `backend/accounts/models.py`
- Create: `backend/accounts/admin.py`
- Create: `backend/accounts/tests/__init__.py`
- Create: `backend/accounts/tests/test_models.py`

**Interfaces:**
- Produces: `accounts.models.User` with fields `email` (unique, `USERNAME_FIELD`), `name`, `role` (choices: `tourist`, `guide`, `sales`, `operations`, `admin`; default `tourist`), `is_active`, `is_staff`, `date_joined`. `accounts.managers.UserManager.create_user(email, password=None, name="", role="tourist", **extra)` and `.create_superuser(email, password, name="", **extra)` (forces `role="admin"`, `is_staff=True`, `is_superuser=True`).

- [ ] **Step 1: Create the app skeleton**

```bash
cd backend
.venv/Scripts/python manage.py startapp accounts
mkdir accounts/tests
type nul > accounts/tests/__init__.py
del accounts/tests.py
```

(`startapp` generates a flat `tests.py`; remove it since we're using a `tests/` package.)

- [ ] **Step 2: Write the failing test**

`backend/accounts/tests/test_models.py`:

```python
from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user_defaults_to_tourist_role(self):
        user = User.objects.create_user(email="a@example.com", password="pw12345", name="A")
        self.assertEqual(user.role, "tourist")
        self.assertTrue(user.check_password("pw12345"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="pw12345")

    def test_create_superuser_forces_admin_role(self):
        admin = User.objects.create_superuser(email="root@example.com", password="pw12345")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_email_is_the_username_field(self):
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_str_returns_email(self):
        user = User.objects.create_user(email="b@example.com", password="pw12345")
        self.assertEqual(str(user), "b@example.com")
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts
```

Expected: FAIL — `accounts` isn't in `INSTALLED_APPS` correctly yet / `User` has no custom fields (default Django User has no `role`).

- [ ] **Step 4: Write the manager**

`backend/accounts/managers.py`:

```python
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, name="", role="tourist", **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, name="", **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields["role"] = "admin"
        return self.create_user(email, password=password, name=name, **extra_fields)
```

- [ ] **Step 5: Write the model**

`backend/accounts/models.py`:

```python
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("tourist", "Tourist"),
        ("guide", "Guide"),
        ("sales", "Sales Agent"),
        ("operations", "Operations"),
        ("admin", "Administrator"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="tourist")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
```

`backend/accounts/apps.py` (edit the generated file):

```python
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
```

`backend/accounts/admin.py`:

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["email"]
    list_display = ["email", "name", "role", "is_staff", "is_active"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "name", "role", "password1", "password2")}),
    )
    search_fields = ["email", "name"]
    list_filter = ["role", "is_staff", "is_active"]
```

- [ ] **Step 6: Make and run migrations, then run tests**

```bash
cd backend
.venv/Scripts/python manage.py makemigrations accounts
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py test accounts
```

Expected: `Ran 5 tests ... OK`

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/
git commit -m "feat(accounts): add custom User model with role field"
```

---

### Task 3: Cookie-based JWT authentication class

**Files:**
- Create: `backend/accounts/authentication.py`
- Create: `backend/accounts/tests/test_authentication.py`

**Interfaces:**
- Consumes: `settings.AUTH_COOKIE_ACCESS` (from Task 1).
- Produces: `accounts.authentication.CookieJWTAuthentication(rest_framework_simplejwt.authentication.JWTAuthentication)` — overrides `authenticate(request)` to read the raw token from `request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)` instead of the `Authorization` header; returns `None` (unauthenticated, not an error) when the cookie is absent, and raises `InvalidToken`/`AuthenticationFailed` when it's present but invalid — matching `JWTAuthentication`'s normal contract so `IsAuthenticated` yields `401` either way.

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_authentication.py`:

```python
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.authentication import CookieJWTAuthentication

User = get_user_model()


class CookieJWTAuthenticationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="a@example.com", password="pw12345")
        self.auth = CookieJWTAuthentication()
        self.factory = APIRequestFactory()

    def test_returns_none_when_no_cookie_present(self):
        request = self.factory.get("/")
        self.assertIsNone(self.auth.authenticate(request))

    def test_authenticates_valid_cookie_token(self):
        token = str(RefreshToken.for_user(self.user).access_token)
        request = self.factory.get("/")
        request.COOKIES[settings.AUTH_COOKIE_ACCESS] = token
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        authenticated_user, validated_token = result
        self.assertEqual(authenticated_user.pk, self.user.pk)

    def test_rejects_garbage_cookie_token(self):
        from rest_framework_simplejwt.exceptions import InvalidToken

        request = self.factory.get("/")
        request.COOKIES[settings.AUTH_COOKIE_ACCESS] = "not-a-real-token"
        with self.assertRaises(InvalidToken):
            self.auth.authenticate(request)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_authentication
```

Expected: FAIL — `ModuleNotFoundError: No module named 'accounts.authentication'`

- [ ] **Step 3: Write the implementation**

`backend/accounts/authentication.py`:

```python
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_authentication
```

Expected: `Ran 3 tests ... OK`

- [ ] **Step 5: Commit**

```bash
cd backend
git add accounts/authentication.py accounts/tests/test_authentication.py
git commit -m "feat(accounts): read JWT from HttpOnly cookie instead of header"
```

---

### Task 4: `IsAdminRole` permission class

**Files:**
- Create: `backend/accounts/permissions.py`
- Create: `backend/accounts/tests/test_permissions.py`

**Interfaces:**
- Produces: `accounts.permissions.IsAdminRole(rest_framework.permissions.BasePermission)` — `has_permission` is `True` only if `request.user.is_authenticated and request.user.role == "admin"`. `accounts.permissions.IsAdminOrReadOnly` — `SAFE_METHODS` always allowed; other methods require `IsAdminRole`.

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_permissions.py`:

```python
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.permissions import IsAdminOrReadOnly, IsAdminRole

User = get_user_model()


class IsAdminRoleTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def test_admin_has_permission(self):
        request = self.factory.get("/")
        request.user = self.admin
        self.assertTrue(IsAdminRole().has_permission(request, None))

    def test_non_admin_denied(self):
        request = self.factory.get("/")
        request.user = self.tourist
        self.assertFalse(IsAdminRole().has_permission(request, None))


class IsAdminOrReadOnlyTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = User.objects.create_user(email="admin2@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist2@example.com", password="pw12345", role="tourist")

    def test_get_allowed_for_anyone(self):
        request = self.factory.get("/")
        request.user = self.tourist
        self.assertTrue(IsAdminOrReadOnly().has_permission(request, None))

    def test_post_requires_admin(self):
        request = self.factory.post("/")
        request.user = self.tourist
        self.assertFalse(IsAdminOrReadOnly().has_permission(request, None))

    def test_post_allowed_for_admin(self):
        request = self.factory.post("/")
        request.user = self.admin
        self.assertTrue(IsAdminOrReadOnly().has_permission(request, None))
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_permissions
```

Expected: FAIL — `ModuleNotFoundError: No module named 'accounts.permissions'`

- [ ] **Step 3: Write the implementation**

`backend/accounts/permissions.py`:

```python
from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_permissions
```

Expected: `Ran 5 tests ... OK`

- [ ] **Step 5: Commit**

```bash
cd backend
git add accounts/permissions.py accounts/tests/test_permissions.py
git commit -m "feat(accounts): add IsAdminRole and IsAdminOrReadOnly permissions"
```

---

### Task 5: Login view (0.1 Sign In)

**Files:**
- Create: `backend/accounts/serializers.py`
- Create: `backend/accounts/views.py`
- Create: `backend/accounts/urls.py`
- Create: `backend/accounts/tests/test_login.py`

**Interfaces:**
- Consumes: `CookieJWTAuthentication` (Task 3), `settings.AUTH_COOKIE_ACCESS/REFRESH/SECURE/SAMESITE`, `settings.SIMPLE_JWT` (Task 1).
- Produces: `POST /api/auth/login/` — `accounts.views.LoginView`. Registered at `backend/accounts/urls.py` under `path("login/", LoginView.as_view())`, included by `config/urls.py` at `api/auth/`.

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_login.py`:

```python
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class LoginViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("login")
        self.user = User.objects.create_user(
            email="guide@example.com", password="correct-pw", role="guide"
        )

    def test_valid_credentials_returns_role_and_sets_cookies(self):
        response = self.client.post(self.url, {"email": "guide@example.com", "password": "correct-pw"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "guide"})
        self.assertIn(settings.AUTH_COOKIE_ACCESS, response.cookies)
        self.assertIn(settings.AUTH_COOKIE_REFRESH, response.cookies)
        self.assertTrue(response.cookies[settings.AUTH_COOKIE_ACCESS]["httponly"])

    def test_no_tokens_in_json_body(self):
        response = self.client.post(self.url, {"email": "guide@example.com", "password": "correct-pw"})
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertNotIn("token", response.data)

    def test_wrong_password_returns_401(self):
        response = self.client.post(self.url, {"email": "guide@example.com", "password": "wrong-pw"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn(settings.AUTH_COOKIE_ACCESS, response.cookies)

    def test_unknown_email_returns_401(self):
        response = self.client.post(self.url, {"email": "nobody@example.com", "password": "whatever"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_login
```

Expected: FAIL — `NoReverseMatch: 'login' is not a registered namespace` (no `urls.py`/`views.py` yet).

- [ ] **Step 3: Write the serializer**

`backend/accounts/serializers.py`:

```python
from django.contrib.auth import authenticate
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs
```

Django's default `ModelBackend` authenticates via `USERNAME_FIELD`; since `User.USERNAME_FIELD = "email"`, `authenticate(email=..., password=...)` works without extra configuration.

- [ ] **Step 4: Write the view**

`backend/accounts/views.py`:

```python
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer


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
```

- [ ] **Step 5: Wire up urls**

`backend/accounts/urls.py`:

```python
from django.urls import path

from .views import LoginView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
]
```

`backend/config/urls.py` already includes `accounts.urls` at `api/auth/` from Task 1 Step 5 — no change needed here.

- [ ] **Step 6: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_login
```

Expected: `Ran 4 tests ... OK`

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/serializers.py accounts/views.py accounts/urls.py accounts/tests/test_login.py
git commit -m "feat(accounts): add POST /api/auth/login/ with HttpOnly cookie JWTs"
```

---

### Task 6: Logout view with token blacklisting (0.2 Sign Out)

**Files:**
- Modify: `backend/accounts/views.py`
- Modify: `backend/accounts/urls.py`
- Create: `backend/accounts/tests/test_logout.py`

**Interfaces:**
- Consumes: `_set_auth_cookies` helper's counterpart cookie names from Task 5 (`settings.AUTH_COOKIE_ACCESS/REFRESH`); `rest_framework_simplejwt.token_blacklist` app (installed in Task 1).
- Produces: `POST /api/auth/logout/` — `accounts.views.LogoutView`, registered as `path("logout/", LogoutView.as_view(), name="logout")`.

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_logout.py`:

```python
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class LogoutViewTests(APITestCase):
    def setUp(self):
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.user = User.objects.create_user(email="a@example.com", password="pw12345")

    def _login(self):
        return self.client.post(self.login_url, {"email": "a@example.com", "password": "pw12345"})

    def test_logout_clears_cookies_and_returns_200(self):
        self._login()
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_ACCESS].value, "")
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_REFRESH].value, "")

    def test_logout_without_prior_login_returns_401(self):
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_replaying_blacklisted_refresh_token_is_rejected(self):
        self._login()
        refresh_cookie_value = self.client.cookies[settings.AUTH_COOKIE_REFRESH].value
        self.client.post(self.logout_url)

        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import RefreshToken

        with self.assertRaises(TokenError):
            RefreshToken(refresh_cookie_value).verify()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_logout
```

Expected: FAIL — `NoReverseMatch: 'logout' is not a registered namespace`.

- [ ] **Step 3: Add the view**

Append to `backend/accounts/views.py`:

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken as RefreshTokenForBlacklist  # noqa: F401


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
```

(Remove the unused `RefreshTokenForBlacklist` import alias — `RefreshToken` is already imported at the top of `views.py` from Task 5. Just reuse that import; don't add a duplicate.)

- [ ] **Step 4: Wire up the URL**

`backend/accounts/urls.py`:

```python
from django.urls import path

from .views import LoginView, LogoutView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_logout
```

Expected: `Ran 3 tests ... OK`

- [ ] **Step 6: Run the full accounts test suite**

```bash
cd backend
.venv/Scripts/python manage.py test accounts
```

Expected: all tests across `test_models`, `test_authentication`, `test_permissions`, `test_login`, `test_logout` pass.

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/views.py accounts/urls.py accounts/tests/test_logout.py
git commit -m "feat(accounts): add POST /api/auth/logout/ with refresh token blacklisting"
```

---

### Task 7: Admin-invited users endpoint (0.3 step 5)

**Files:**
- Modify: `backend/accounts/serializers.py`
- Modify: `backend/accounts/views.py`
- Create: `backend/accounts/user_urls.py`
- Create: `backend/accounts/tests/test_users.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminRole` (Task 4).
- Produces: `POST /api/users/` — `accounts.views.UserInviteView`, wired at `backend/accounts/user_urls.py`, included by `config/urls.py` at `api/users/` (already present from Task 1 Step 5).

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_users.py`:

```python
from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserInviteViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("invite-user")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.sales = User.objects.create_user(email="sales@example.com", password="pw12345", role="sales")

    def _login_as(self, user, password="pw12345"):
        self.client.post(reverse("login"), {"email": user.email, "password": password})

    def test_admin_can_invite_sales_agent(self):
        self._login_as(self.admin)
        response = self.client.post(self.url, {"email": "newsales@example.com", "name": "New Sales", "role": "sales"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newsales@example.com", role="sales").exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("newsales@example.com", mail.outbox[0].to)

    def test_non_admin_cannot_invite(self):
        self._login_as(self.sales)
        response = self.client.post(self.url, {"email": "x@example.com", "name": "X", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_invite(self):
        response = self.client.post(self.url, {"email": "x@example.com", "name": "X", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invited_user_has_unusable_password_until_they_set_one(self):
        self._login_as(self.admin)
        self.client.post(self.url, {"email": "ops@example.com", "name": "Ops", "role": "operations"})
        invited = User.objects.get(email="ops@example.com")
        self.assertFalse(invited.has_usable_password())
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_users
```

Expected: FAIL — `NoReverseMatch: 'invite-user' is not a registered namespace`.

- [ ] **Step 3: Add the serializer**

Append to `backend/accounts/serializers.py`:

```python
from django.contrib.auth import get_user_model

User = get_user_model()


class UserInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "name", "role"]

    def validate_role(self, value):
        if value not in ("sales", "operations"):
            raise serializers.ValidationError("Invitable roles are 'sales' or 'operations'.")
        return value

    def create(self, validated_data):
        user = User(email=validated_data["email"], name=validated_data.get("name", ""), role=validated_data["role"])
        user.set_unusable_password()
        user.save()
        return user
```

- [ ] **Step 4: Add the view**

Append to `backend/accounts/views.py`:

```python
from django.core.mail import send_mail
from rest_framework import generics

from .permissions import IsAdminRole
from .serializers import UserInviteSerializer


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
```

- [ ] **Step 5: Wire up the URL**

`backend/accounts/user_urls.py`:

```python
from django.urls import path

from .views import UserInviteView

urlpatterns = [
    path("", UserInviteView.as_view(), name="invite-user"),
]
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_users
```

Expected: `Ran 4 tests ... OK`

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/serializers.py accounts/views.py accounts/user_urls.py accounts/tests/test_users.py
git commit -m "feat(accounts): add admin-only POST /api/users/ to invite Sales/Ops staff"
```

---

### Task 8: `destinations` app

**Files:**
- Create: `backend/destinations/__init__.py`
- Create: `backend/destinations/apps.py`
- Create: `backend/destinations/models.py`
- Create: `backend/destinations/serializers.py`
- Create: `backend/destinations/views.py`
- Create: `backend/destinations/urls.py`
- Create: `backend/destinations/admin.py`
- Create: `backend/destinations/tests/__init__.py`
- Create: `backend/destinations/tests/test_destinations.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminOrReadOnly` (Task 4).
- Produces: `Destination` model (PK `slug`), `DestinationExperience` (FK `destination`, related_name `experiences`). `GET/POST /api/destinations/`, `GET/PATCH/DELETE /api/destinations/<slug>/`.

- [ ] **Step 1: Create the app skeleton**

```bash
cd backend
.venv/Scripts/python manage.py startapp destinations
mkdir destinations/tests
type nul > destinations/tests/__init__.py
del destinations/tests.py
```

- [ ] **Step 2: Write the failing test**

`backend/destinations/tests/test_destinations.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class DestinationAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("destination-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.payload = {
            "slug": "arusha",
            "name": "Arusha",
            "images": ["/images/destinations/arusha-1.jpg"],
            "image_alt": "Arusha city view",
            "badge": "Safari Capital",
            "tags": ["Gateway to Northern Circuit"],
            "best_time_to_visit": "June - October",
            "highlight": "Cultural Markets",
            "link_label": "View Regional Tours",
            "about": "Arusha is the safari capital of Tanzania.",
            "wildlife": "Giraffe, buffalo, flamingos.",
            "getting_there": "Kilimanjaro International Airport is 45 minutes away.",
            "experiences": [{"name": "Coffee Tour", "description": "Walk a working estate."}],
        }

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_can_list_destinations(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create_destination(self):
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_create_destination_with_experiences(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "arusha")
        self.assertEqual(len(response.data["experiences"]), 1)
        self.assertEqual(response.data["experiences"][0]["name"], "Coffee Tour")

    def test_non_admin_cannot_create_destination(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_by_slug(self):
        self._login_as(self.admin)
        self.client.post(self.list_url, self.payload, format="json")
        response = self.client.get(reverse("destination-detail", args=["arusha"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Arusha")
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test destinations
```

Expected: FAIL — `NoReverseMatch: 'destination-list' is not a registered namespace`.

- [ ] **Step 4: Write the models**

`backend/destinations/models.py`:

```python
from django.db import models


class Destination(models.Model):
    slug = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=120)
    images = models.JSONField(default=list)
    image_alt = models.CharField(max_length=255)
    badge = models.CharField(max_length=64)
    tags = models.JSONField(default=list)
    best_time_to_visit = models.CharField(max_length=120)
    highlight = models.CharField(max_length=255)
    link_label = models.CharField(max_length=64)
    about = models.TextField()
    wildlife = models.TextField()
    getting_there = models.TextField()

    def __str__(self):
        return self.name


class DestinationExperience(models.Model):
    destination = models.ForeignKey(Destination, related_name="experiences", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.destination_id}: {self.name}"
```

`backend/destinations/apps.py`:

```python
from django.apps import AppConfig


class DestinationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "destinations"
```

- [ ] **Step 5: Write the serializer**

`backend/destinations/serializers.py`:

```python
from rest_framework import serializers

from .models import Destination, DestinationExperience


class DestinationExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationExperience
        fields = ["name", "description"]


class DestinationSerializer(serializers.ModelSerializer):
    experiences = DestinationExperienceSerializer(many=True)

    class Meta:
        model = Destination
        fields = [
            "slug", "name", "images", "image_alt", "badge", "tags",
            "best_time_to_visit", "highlight", "link_label", "about",
            "wildlife", "getting_there", "experiences",
        ]

    def create(self, validated_data):
        experiences_data = validated_data.pop("experiences")
        destination = Destination.objects.create(**validated_data)
        for order, experience in enumerate(experiences_data):
            DestinationExperience.objects.create(destination=destination, order=order, **experience)
        return destination

    def update(self, instance, validated_data):
        experiences_data = validated_data.pop("experiences", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if experiences_data is not None:
            instance.experiences.all().delete()
            for order, experience in enumerate(experiences_data):
                DestinationExperience.objects.create(destination=instance, order=order, **experience)
        return instance
```

- [ ] **Step 6: Write the view and urls**

`backend/destinations/views.py`:

```python
from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import Destination
from .serializers import DestinationSerializer


class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all().prefetch_related("experiences")
    serializer_class = DestinationSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
```

`backend/destinations/urls.py`:

```python
from rest_framework.routers import DefaultRouter

from .views import DestinationViewSet

router = DefaultRouter()
router.register("", DestinationViewSet, basename="destination")

urlpatterns = router.urls
```

`backend/destinations/admin.py`:

```python
from django.contrib import admin

from .models import Destination, DestinationExperience


class DestinationExperienceInline(admin.TabularInline):
    model = DestinationExperience
    extra = 1


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "badge"]
    inlines = [DestinationExperienceInline]
```

- [ ] **Step 7: Make and run migrations, then run tests**

```bash
cd backend
.venv/Scripts/python manage.py makemigrations destinations
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py test destinations
```

Expected: `Ran 5 tests ... OK`

- [ ] **Step 8: Commit**

```bash
cd backend
git add destinations/
git commit -m "feat(destinations): add Destination model and /api/destinations/ CRUD"
```

---

### Task 9: `safaris` app

**Files:**
- Create: `backend/safaris/__init__.py`
- Create: `backend/safaris/apps.py`
- Create: `backend/safaris/models.py`
- Create: `backend/safaris/serializers.py`
- Create: `backend/safaris/views.py`
- Create: `backend/safaris/urls.py`
- Create: `backend/safaris/admin.py`
- Create: `backend/safaris/tests/__init__.py`
- Create: `backend/safaris/tests/test_safaris.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminOrReadOnly` (Task 4).
- Produces: `SafariPackage` model (PK `slug`), `ItineraryDay` (FK `safari`, related_name `itinerary`). `GET/POST /api/safaris/`, `GET/PATCH/DELETE /api/safaris/<slug>/`.

- [ ] **Step 1: Create the app skeleton**

```bash
cd backend
.venv/Scripts/python manage.py startapp safaris
mkdir safaris/tests
type nul > safaris/tests/__init__.py
del safaris/tests.py
```

- [ ] **Step 2: Write the failing test**

`backend/safaris/tests/test_safaris.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SafariPackageAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("safari-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.payload = {
            "slug": "great-migration-path",
            "title": "Great Migration Path",
            "image": "https://example.com/lions.jpg",
            "image_alt": "A pride of lions in golden grass.",
            "rating": "4.9",
            "days": 8,
            "accommodation": "Luxury Tents",
            "price": 4250,
            "badge": "Most Popular",
            "signature": True,
            "destination": "Serengeti National Park",
            "overview": "Follow the herds across the Serengeti's endless plains.",
            "highlights": ["Great Migration river crossings"],
            "included": ["Private 4x4 Land Cruiser & driver-guide"],
            "excluded": ["International flights"],
            "itinerary": [
                {"day": 1, "title": "Arrival in Arusha", "description": "Airport pickup and transfer."},
                {"day": 2, "title": "Serengeti North", "description": "Fly to the northern Serengeti."},
            ],
        }

    def _login_as_admin(self):
        self.client.post(reverse("login"), {"email": self.admin.email, "password": "pw12345"})

    def test_anonymous_can_list_safaris(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_create_safari_with_itinerary(self):
        self._login_as_admin()
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["itinerary"]), 2)
        self.assertEqual(response.data["itinerary"][0]["title"], "Arrival in Arusha")

    def test_anonymous_cannot_create_safari(self):
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_itinerary_days_are_ordered(self):
        self._login_as_admin()
        payload = dict(self.payload)
        payload["slug"] = "reordered"
        payload["itinerary"] = [
            {"day": 2, "title": "Second", "description": "d2"},
            {"day": 1, "title": "First", "description": "d1"},
        ]
        self.client.post(self.list_url, payload, format="json")
        response = self.client.get(reverse("safari-detail", args=["reordered"]))
        self.assertEqual([d["day"] for d in response.data["itinerary"]], [1, 2])
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test safaris
```

Expected: FAIL — `NoReverseMatch: 'safari-list' is not a registered namespace`.

- [ ] **Step 4: Write the models**

`backend/safaris/models.py`:

```python
from django.db import models


class SafariPackage(models.Model):
    DESTINATION_CHOICES = [
        ("Serengeti National Park", "Serengeti National Park"),
        ("Ngorongoro Conservation Area", "Ngorongoro Conservation Area"),
        ("Tarangire & Manyara", "Tarangire & Manyara"),
        ("Zanzibar Extensions", "Zanzibar Extensions"),
    ]

    slug = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=150)
    image = models.URLField(max_length=500)
    image_alt = models.CharField(max_length=255)
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    days = models.PositiveIntegerField()
    accommodation = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    badge = models.CharField(max_length=64, blank=True)
    signature = models.BooleanField(default=False)
    destination = models.CharField(max_length=40, choices=DESTINATION_CHOICES)
    overview = models.TextField()
    highlights = models.JSONField(default=list)
    included = models.JSONField(default=list)
    excluded = models.JSONField(default=list)

    def __str__(self):
        return self.title


class ItineraryDay(models.Model):
    safari = models.ForeignKey(SafariPackage, related_name="itinerary", on_delete=models.CASCADE)
    day = models.PositiveIntegerField()
    title = models.CharField(max_length=150)
    description = models.TextField()

    class Meta:
        ordering = ["day"]

    def __str__(self):
        return f"{self.safari_id} day {self.day}: {self.title}"
```

`backend/safaris/apps.py`:

```python
from django.apps import AppConfig


class SafarisConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "safaris"
```

- [ ] **Step 5: Write the serializer**

`backend/safaris/serializers.py`:

```python
from rest_framework import serializers

from .models import ItineraryDay, SafariPackage


class ItineraryDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryDay
        fields = ["day", "title", "description"]


class SafariPackageSerializer(serializers.ModelSerializer):
    itinerary = ItineraryDaySerializer(many=True)

    class Meta:
        model = SafariPackage
        fields = [
            "slug", "title", "image", "image_alt", "rating", "days",
            "accommodation", "price", "badge", "signature", "destination",
            "overview", "highlights", "included", "excluded", "itinerary",
        ]

    def create(self, validated_data):
        itinerary_data = validated_data.pop("itinerary")
        safari = SafariPackage.objects.create(**validated_data)
        for day in itinerary_data:
            ItineraryDay.objects.create(safari=safari, **day)
        return safari

    def update(self, instance, validated_data):
        itinerary_data = validated_data.pop("itinerary", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if itinerary_data is not None:
            instance.itinerary.all().delete()
            for day in itinerary_data:
                ItineraryDay.objects.create(safari=instance, **day)
        return instance
```

- [ ] **Step 6: Write the view, urls, admin**

`backend/safaris/views.py`:

```python
from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import SafariPackage
from .serializers import SafariPackageSerializer


class SafariPackageViewSet(viewsets.ModelViewSet):
    queryset = SafariPackage.objects.all().prefetch_related("itinerary")
    serializer_class = SafariPackageSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
```

`backend/safaris/urls.py`:

```python
from rest_framework.routers import DefaultRouter

from .views import SafariPackageViewSet

router = DefaultRouter()
router.register("", SafariPackageViewSet, basename="safari")

urlpatterns = router.urls
```

`backend/safaris/admin.py`:

```python
from django.contrib import admin

from .models import ItineraryDay, SafariPackage


class ItineraryDayInline(admin.TabularInline):
    model = ItineraryDay
    extra = 1


@admin.register(SafariPackage)
class SafariPackageAdmin(admin.ModelAdmin):
    list_display = ["slug", "title", "destination", "price", "signature"]
    inlines = [ItineraryDayInline]
```

- [ ] **Step 7: Make and run migrations, then run tests**

```bash
cd backend
.venv/Scripts/python manage.py makemigrations safaris
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py test safaris
```

Expected: `Ran 4 tests ... OK`

- [ ] **Step 8: Commit**

```bash
cd backend
git add safaris/
git commit -m "feat(safaris): add SafariPackage model and /api/safaris/ CRUD"
```

---

### Task 10: `pricing` app — seasonal multipliers

**Files:**
- Create: `backend/pricing/__init__.py`
- Create: `backend/pricing/apps.py`
- Create: `backend/pricing/models.py`
- Create: `backend/pricing/serializers.py`
- Create: `backend/pricing/views.py`
- Create: `backend/pricing/urls.py`
- Create: `backend/pricing/admin.py`
- Create: `backend/pricing/tests/__init__.py`
- Create: `backend/pricing/tests/test_pricing.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminRole` (Task 4).
- Produces: `Season` model. `GET/POST /api/pricing/seasons/`, `GET/PATCH/DELETE /api/pricing/seasons/<id>/` — all admin-only (no public read, per spec: this data isn't customer-facing).

- [ ] **Step 1: Create the app skeleton**

```bash
cd backend
.venv/Scripts/python manage.py startapp pricing
mkdir pricing/tests
type nul > pricing/tests/__init__.py
del pricing/tests.py
```

- [ ] **Step 2: Write the failing test**

`backend/pricing/tests/test_pricing.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SeasonAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("season-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.payload = {
            "name": "Peak Season",
            "start_date": "2026-06-01",
            "end_date": "2026-10-31",
            "multiplier": "1.25",
        }

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list_seasons(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list_seasons(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_and_patch_season(self):
        self._login_as(self.admin)
        create_response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        season_id = create_response.data["id"]

        patch_response = self.client.patch(
            reverse("season-detail", args=[season_id]), {"multiplier": "1.5"}, format="json"
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["multiplier"], "1.50")
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test pricing
```

Expected: FAIL — `NoReverseMatch: 'season-list' is not a registered namespace`.

- [ ] **Step 4: Write the model**

`backend/pricing/models.py`:

```python
from django.db import models


class Season(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)

    def __str__(self):
        return f"{self.name} ({self.multiplier}x)"
```

`backend/pricing/apps.py`:

```python
from django.apps import AppConfig


class PricingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pricing"
```

- [ ] **Step 5: Write the serializer, view, urls, admin**

`backend/pricing/serializers.py`:

```python
from rest_framework import serializers

from .models import Season


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["id", "name", "start_date", "end_date", "multiplier"]
```

`backend/pricing/views.py`:

```python
from rest_framework import viewsets

from accounts.permissions import IsAdminRole

from .models import Season
from .serializers import SeasonSerializer


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by("start_date")
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminRole]
```

`backend/pricing/urls.py`:

```python
from rest_framework.routers import DefaultRouter

from .views import SeasonViewSet

router = DefaultRouter()
router.register("seasons", SeasonViewSet, basename="season")

urlpatterns = router.urls
```

`backend/pricing/admin.py`:

```python
from django.contrib import admin

from .models import Season

admin.site.register(Season)
```

- [ ] **Step 6: Make and run migrations, then run tests**

```bash
cd backend
.venv/Scripts/python manage.py makemigrations pricing
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py test pricing
```

Expected: `Ran 3 tests ... OK`

- [ ] **Step 7: Commit**

```bash
cd backend
git add pricing/
git commit -m "feat(pricing): add Season model and admin-only /api/pricing/seasons/"
```

---

### Task 11: `guides` app — staff roster

**Files:**
- Create: `backend/guides/__init__.py`
- Create: `backend/guides/apps.py`
- Create: `backend/guides/models.py`
- Create: `backend/guides/serializers.py`
- Create: `backend/guides/views.py`
- Create: `backend/guides/urls.py`
- Create: `backend/guides/admin.py`
- Create: `backend/guides/tests/__init__.py`
- Create: `backend/guides/tests/test_guides.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminRole` (Task 4).
- Produces: `Guide` model. `GET/POST /api/guides/`, `GET/PATCH/DELETE /api/guides/<id>/` — admin-only, mirroring `adminStaff.ts`'s `name`/`role`/`status`/`rating` fields.

- [ ] **Step 1: Create the app skeleton**

```bash
cd backend
.venv/Scripts/python manage.py startapp guides
mkdir guides/tests
type nul > guides/tests/__init__.py
del guides/tests.py
```

- [ ] **Step 2: Write the failing test**

`backend/guides/tests/test_guides.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class GuideAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("guide-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.payload = {
            "name": "Juma Mdoe",
            "role": "Senior Guide",
            "status": "Available",
            "rating": "4.9",
        }

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list_guides(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_create_guide(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_register_guide(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Juma Mdoe")
        self.assertEqual(response.data["status"], "Available")

    def test_invalid_role_choice_rejected(self):
        self._login_as(self.admin)
        bad_payload = dict(self.payload, role="Not A Real Role")
        response = self.client.post(self.list_url, bad_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test guides
```

Expected: FAIL — `NoReverseMatch: 'guide-list' is not a registered namespace`.

- [ ] **Step 4: Write the model**

`backend/guides/models.py`:

```python
from django.db import models


class Guide(models.Model):
    ROLE_CHOICES = [
        ("Senior Guide", "Senior Guide"),
        ("Expert Guide", "Expert Guide"),
        ("Driver-Guide", "Driver-Guide"),
        ("Camp Chef", "Camp Chef"),
        ("Tour Helper", "Tour Helper"),
    ]
    STATUS_CHOICES = [
        ("Available", "Available"),
        ("On Trip", "On Trip"),
        ("Off-Duty", "Off-Duty"),
    ]

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Available")
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)

    def __str__(self):
        return self.name
```

`backend/guides/apps.py`:

```python
from django.apps import AppConfig


class GuidesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "guides"
```

- [ ] **Step 5: Write the serializer, view, urls, admin**

`backend/guides/serializers.py`:

```python
from rest_framework import serializers

from .models import Guide


class GuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        fields = ["id", "name", "role", "status", "rating"]
```

`backend/guides/views.py`:

```python
from rest_framework import viewsets

from accounts.permissions import IsAdminRole

from .models import Guide
from .serializers import GuideSerializer


class GuideViewSet(viewsets.ModelViewSet):
    queryset = Guide.objects.all().order_by("name")
    serializer_class = GuideSerializer
    permission_classes = [IsAdminRole]
```

`backend/guides/urls.py`:

```python
from rest_framework.routers import DefaultRouter

from .views import GuideViewSet

router = DefaultRouter()
router.register("", GuideViewSet, basename="guide")

urlpatterns = router.urls
```

`backend/guides/admin.py`:

```python
from django.contrib import admin

from .models import Guide

admin.site.register(Guide)
```

- [ ] **Step 6: Make and run migrations, then run tests**

```bash
cd backend
.venv/Scripts/python manage.py makemigrations guides
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py test guides
```

Expected: `Ran 4 tests ... OK`

- [ ] **Step 7: Commit**

```bash
cd backend
git add guides/
git commit -m "feat(guides): add Guide model and admin-only /api/guides/"
```

---

### Task 12: Full-suite verification and README

**Files:**
- Create: `backend/README.md`

**Interfaces:**
- Consumes: every app from Tasks 1–11.
- Produces: a documented, fully-tested backend ready for frontend integration (out of scope, separate follow-up).

- [ ] **Step 1: Run the entire test suite**

```bash
cd backend
.venv/Scripts/python manage.py test
```

Expected: all tests across `accounts`, `destinations`, `safaris`, `pricing`, `guides` pass (approximately 30 tests total), zero failures.

- [ ] **Step 2: Run `manage.py check` and start the dev server as a smoke test**

```bash
cd backend
.venv/Scripts/python manage.py check
.venv/Scripts/python manage.py runserver
```

In a second terminal:

```bash
curl -i http://127.0.0.1:8000/api/destinations/
```

Expected: `manage.py check` reports `System check identified no issues`; the `curl` call returns `200 OK` with `[]` (empty list — no destinations created outside tests). Stop the dev server (`Ctrl+C`) after confirming.

- [ ] **Step 3: Write `backend/README.md`**

```markdown
# SafariQuest Backend

Django + Django REST Framework backend for SafariQuest. Implements Part 0 of the
ops manual: sign in/out with HttpOnly-cookie JWTs and role-based redirect, plus
first-time platform setup (destinations, safaris, pricing seasons, guides, staff
invites).

## Setup

\`\`\`bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
cp .env.example .env
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py createsuperuser
.venv/Scripts/python manage.py runserver
\`\`\`

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login/` | Public |
| POST | `/api/auth/logout/` | Authenticated |
| POST | `/api/users/` | Admin |
| GET | `/api/destinations/` | Public |
| POST/PATCH/DELETE | `/api/destinations/` | Admin |
| GET | `/api/safaris/` | Public |
| POST/PATCH/DELETE | `/api/safaris/` | Admin |
| GET/POST/PATCH/DELETE | `/api/pricing/seasons/` | Admin |
| GET/POST/PATCH/DELETE | `/api/guides/` | Admin |

## Running tests

\`\`\`bash
.venv/Scripts/python manage.py test
\`\`\`

## Not yet implemented

- Google OAuth login
- Bookings, inquiries, invoicing, complaints (later ops-manual parts)
- Frontend wiring (see `website/`)
```

- [ ] **Step 4: Commit**

```bash
cd backend
git add README.md
git commit -m "docs: add backend README with setup and endpoint reference"
```

---

## Self-Review Notes

- **Spec coverage:** 0.1 → Task 5; 0.2 → Task 6; 0.3 steps 1–2 (destinations/safaris) → Tasks 8–9; step 3 (pricing) → Task 10; step 4 (guides) → Task 11; step 5 (invite users) → Task 7. All five 0.3 endpoints and both 0.1/0.2 endpoints are covered.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code.
- **Type consistency:** `CookieJWTAuthentication` (Task 3) is referenced by exact dotted path in `settings.py` (Task 1) and used implicitly by every `APITestCase` via cookies set in `LoginView` (Task 5). `IsAdminRole`/`IsAdminOrReadOnly` (Task 4) are imported by their exact class names in Tasks 8–11. Field names in serializers (`slug`, `experiences`, `itinerary`, etc.) match the model fields defined in the same task.
