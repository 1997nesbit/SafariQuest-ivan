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
