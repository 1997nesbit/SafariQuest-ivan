from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class MeViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("me")
        self.user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide")

    def test_anonymous_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_returns_role(self):
        self.client.post(reverse("login"), {"email": "guide@example.com", "password": "pw12345"})
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "guide"})

    def test_works_after_silent_refresh(self):
        self.client.post(reverse("login"), {"email": "guide@example.com", "password": "pw12345"})
        self.client.cookies[__import__("django.conf", fromlist=["settings"]).settings.AUTH_COOKIE_ACCESS] = "garbage"
        refresh_response = self.client.post(reverse("refresh"))
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "guide"})
