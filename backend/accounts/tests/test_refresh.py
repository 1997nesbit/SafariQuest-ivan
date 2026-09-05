from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RefreshViewTests(APITestCase):
    def setUp(self):
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.refresh_url = reverse("refresh")
        self.user = User.objects.create_user(email="a@example.com", password="pw12345")

    def _login(self):
        return self.client.post(self.login_url, {"email": "a@example.com", "password": "pw12345"})

    def test_valid_refresh_cookie_returns_new_access_cookie(self):
        self._login()
        old_access = self.client.cookies[settings.AUTH_COOKIE_ACCESS].value
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(settings.AUTH_COOKIE_ACCESS, response.cookies)
        new_access = response.cookies[settings.AUTH_COOKIE_ACCESS].value
        self.assertTrue(new_access)
        # A new access cookie was issued (refresh token itself is not rotated/reissued).
        self.assertNotIn(settings.AUTH_COOKIE_REFRESH, response.cookies)

    def test_missing_refresh_cookie_returns_401(self):
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_refresh_cookie_returns_401(self):
        self.client.cookies[settings.AUTH_COOKIE_REFRESH] = "garbage"
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_blacklisted_refresh_token_returns_401(self):
        self._login()
        self.client.post(self.logout_url)
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_response_body_has_no_tokens(self):
        self._login()
        response = self.client.post(self.refresh_url)
        self.assertNotIn(b"access", response.content)
        self.assertNotIn(b"refresh", response.content)
