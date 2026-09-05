from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("invite-user")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin", name="Admin One")
        self.sales = User.objects.create_user(email="sales@example.com", password="pw12345", role="sales", name="Sales One")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist", name="Tourist One")
        self.guide = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide", name="Guide One")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list(self):
        self._login_as(self.sales)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_only_staff_roles(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = {row["email"] for row in response.data}
        self.assertEqual(emails, {"admin@example.com", "sales@example.com", "guide@example.com"})
        self.assertNotIn("tourist@example.com", emails)

    def test_list_response_shape_has_no_password_fields(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        row = next(r for r in response.data if r["email"] == "sales@example.com")
        self.assertEqual(set(row.keys()), {"id", "name", "email", "role"})

    def test_post_still_creates_a_user(self):
        self._login_as(self.admin)
        response = self.client.post(self.url, {"email": "new@example.com", "name": "New", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
