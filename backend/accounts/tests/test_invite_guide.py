from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class InviteGuideTests(APITestCase):
    def setUp(self):
        self.url = reverse("invite-user")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")

    def _login_as_admin(self):
        self.client.post(reverse("login"), {"email": self.admin.email, "password": "pw12345"})

    def test_admin_can_invite_a_guide(self):
        self._login_as_admin()
        response = self.client.post(self.url, {"email": "guide@example.com", "name": "New Guide", "role": "guide"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="guide@example.com")
        self.assertEqual(user.role, "guide")
        self.assertFalse(user.has_usable_password())

    def test_tourist_role_still_rejected(self):
        self._login_as_admin()
        response = self.client.post(self.url, {"email": "x@example.com", "name": "X", "role": "tourist"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_role_still_rejected(self):
        self._login_as_admin()
        response = self.client.post(self.url, {"email": "y@example.com", "name": "Y", "role": "admin"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invited_guide_appears_in_list(self):
        self._login_as_admin()
        self.client.post(self.url, {"email": "guide2@example.com", "name": "Guide Two", "role": "guide"})
        response = self.client.get(self.url)
        emails = {row["email"] for row in response.data}
        self.assertIn("guide2@example.com", emails)
