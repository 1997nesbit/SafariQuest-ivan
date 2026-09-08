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
