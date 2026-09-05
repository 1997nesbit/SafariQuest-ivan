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
