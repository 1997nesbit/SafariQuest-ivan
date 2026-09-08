from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("register")

    def test_valid_registration_creates_tourist_and_sets_cookies(self):
        response = self.client.post(
            self.url, {"email": "new@example.com", "name": "New Tourist", "password": "correct-horse-battery"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data, {"role": "tourist"})
        self.assertIn(settings.AUTH_COOKIE_ACCESS, response.cookies)
        self.assertIn(settings.AUTH_COOKIE_REFRESH, response.cookies)
        user = User.objects.get(email="new@example.com")
        self.assertEqual(user.role, "tourist")
        self.assertTrue(user.check_password("correct-horse-battery"))

    def test_duplicate_email_returns_400(self):
        User.objects.create_user(email="dup@example.com", password="pw12345678", role="tourist")
        response = self.client.post(self.url, {"email": "dup@example.com", "name": "Dup", "password": "another-long-pw"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_weak_password_returns_400(self):
        response = self.client.post(self.url, {"email": "weak@example.com", "name": "Weak", "password": "123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_tokens_in_response_body(self):
        response = self.client.post(
            self.url, {"email": "clean@example.com", "name": "Clean", "password": "correct-horse-battery"}
        )
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
