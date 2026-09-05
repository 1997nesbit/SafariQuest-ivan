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

    def test_logout_clears_cookies_even_with_unusable_access_token(self):
        self._login()
        self.client.cookies[settings.AUTH_COOKIE_ACCESS] = "garbage"
        response = self.client.post(self.logout_url)
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_ACCESS].value, "")
        self.assertEqual(response.cookies[settings.AUTH_COOKIE_REFRESH].value, "")

    def test_replaying_blacklisted_refresh_token_is_rejected(self):
        self._login()
        refresh_cookie_value = self.client.cookies[settings.AUTH_COOKIE_REFRESH].value
        self.client.post(self.logout_url)

        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import RefreshToken

        with self.assertRaises(TokenError):
            RefreshToken(refresh_cookie_value).verify()
