import sys
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

if not DEBUG and SECRET_KEY == "dev-secret-key-change-me":
    raise ImproperlyConfigured(
        "SECRET_KEY must be set to a non-default value when DEBUG is False."
    )
if not DEBUG and "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS must be set to specific hosts when DEBUG is False."
    )

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
    "region_safaris",
    "team",
    "promotions",
    "pricing",
    "guides",
    "bookings",
    "uploads",
    "support",
    "analytics",
    "audit",
    "referrals",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
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
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    # Declared explicitly: on Django 5.1+ there is no implicit default any more, so
    # without this an environment with no bucket configured (local dev) has no file
    # storage at all and every upload 500s with "Could not find config for
    # 'default'". The S3 block below replaces it whenever a bucket is set.
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Uploaded images (destinations/parks/safaris admin uploads) go to MinIO's
# S3-compatible API in any environment where it's configured, so they
# survive redeploys — Railway's container filesystem is ephemeral. Falls
# back to local disk (MEDIA_ROOT above) when unset, e.g. local dev.
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "")
if AWS_STORAGE_BUCKET_NAME:
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "")
    AWS_S3_CUSTOM_DOMAIN = os.environ.get("AWS_S3_CUSTOM_DOMAIN", "") or None
    AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1")
    AWS_S3_ADDRESSING_STYLE = "path"
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = "public-read"
    AWS_QUERYSTRING_AUTH = False
    STORAGES["default"] = {"BACKEND": "storages.backends.s3.S3Storage"}

# Throttling keys anonymous callers by client IP. Behind a reverse proxy
# (Railway) REMOTE_ADDR is the proxy, which would put every visitor in one
# shared bucket and let a single abuser lock out everybody — so the number of
# trusted proxies has to be declared for DRF to read X-Forwarded-For instead.
# Set NUM_PROXIES=1 in the deployed environment; unset locally means "no proxy".
_num_proxies = os.environ.get("NUM_PROXIES", "")
NUM_PROXIES = int(_num_proxies) if _num_proxies else None

# Throttle counters live in the default cache. Nothing configures CACHES, so
# that is LocMemCache: per-process and wiped on restart, which means the real
# ceiling is (rate x gunicorn workers) and resets on every redeploy. That is
# still a meaningful brake on credential stuffing, but a shared Redis cache is
# what makes these limits exact.
THROTTLE_RATES = {
    "anon": "1000/hour",
    "user": "3000/hour",
    "login": "20/min",
    "signup": "10/hour",
    "booking_create": "10/hour",
    "funnel_event": "300/hour",
    "promotion_click": "120/hour",
}

# The test runner shares one process, so LocMemCache carries throttle counters
# from test to test and unrelated cases start failing once a bucket fills.
# Rates are disabled under test; test_throttling.py re-enables them explicitly
# with override_settings so the behaviour itself stays covered.
if "test" in sys.argv:
    THROTTLE_RATES = {scope: None for scope in THROTTLE_RATES}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.CookieJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": THROTTLE_RATES,
    "NUM_PROXIES": NUM_PROXIES,
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
AUTH_COOKIE_SAMESITE = os.environ.get("AUTH_COOKIE_SAMESITE", "Lax")

# The CSRF cookie has to travel on the same terms as the auth cookie it guards:
# if the auth cookie is cross-site (SameSite=None) but the CSRF cookie is not,
# it never reaches us and every write fails the check.
CSRF_COOKIE_SAMESITE = AUTH_COOKIE_SAMESITE
CSRF_COOKIE_SECURE = not DEBUG
if AUTH_COOKIE_SAMESITE == "None" and not AUTH_COOKIE_SECURE:
    raise ImproperlyConfigured(
        "AUTH_COOKIE_SAMESITE=None requires secure cookies; browsers drop "
        "SameSite=None cookies that are not marked Secure. Set DEBUG=False "
        "or use AUTH_COOKIE_SAMESITE=Lax."
    )

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin for origin in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if origin
]

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Django's CSRF check compares the request's Origin against CSRF_TRUSTED_ORIGINS
# plus this host. The SPA is always a different origin than the API — a
# different port locally, a different domain in production — so its origin has
# to be trusted or every write fails with "Origin checking failed". Deriving it
# from FRONTEND_URL keeps that from being a thing you can forget to configure.
_frontend_origin = "//".join(FRONTEND_URL.split("//")[:2]).rstrip("/") if "//" in FRONTEND_URL else ""
if _frontend_origin and _frontend_origin not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(_frontend_origin)

# Email. This was pinned to the console backend in every environment, which
# meant four user-facing flows silently sent nothing in production — worst of
# all the invite, so an invited admin could never set a password. The backend
# now follows EMAIL_HOST: configure SMTP and real mail goes out; leave it unset
# locally and it still prints to the console.
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_HOST
    else "django.core.mail.backends.console.EmailBackend",
)
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
# Without a timeout a wedged SMTP server holds the worker open for as long as
# the OS lets it, turning "the quote email is slow" into "the API is down".
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "SafariQuest <no-reply@localhost>")

# Silence here is what caused the original bug, so a deployment has to say
# which it wants: configure EMAIL_HOST, or name the console backend explicitly
# to acknowledge that mail is going nowhere yet.
if not DEBUG and "console" in EMAIL_BACKEND and not os.environ.get("EMAIL_BACKEND"):
    raise ImproperlyConfigured(
        "Email is not configured. Set EMAIL_HOST (plus EMAIL_HOST_USER / "
        "EMAIL_HOST_PASSWORD / DEFAULT_FROM_EMAIL) to send real mail, or set "
        "EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend "
        "explicitly to deploy without it. Leaving it implicit means invite and "
        "quote emails are dropped with no error."
    )

# TLS. Railway terminates TLS and forwards the request over plain HTTP, so
# without the proxy header Django believes every request is insecure:
# request.is_secure() is False, Secure cookies are never honoured, and
# SECURE_SSL_REDIRECT would redirect forever. Trusting X-Forwarded-Proto is
# only safe behind a proxy that always overwrites it, which is exactly what
# NUM_PROXIES declares — so that one setting governs both this and the client
# IP used for rate limiting.
if NUM_PROXIES:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = bool(NUM_PROXIES) and os.environ.get("SECURE_SSL_REDIRECT", "True") == "True"
    # HSTS is a one-way door: browsers remember it for the full max-age and
    # will refuse plain HTTP to this host until it expires. Off by default so
    # turning it on stays a deliberate decision.
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "0"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False") == "True"
    SECURE_HSTS_PRELOAD = os.environ.get("SECURE_HSTS_PRELOAD", "False") == "True"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "django.security": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
