from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserInviteViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("invite-user")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.sales = User.objects.create_user(email="sales@example.com", password="pw12345", role="sales")

    def _login_as(self, user, password="pw12345"):
        self.client.post(reverse("login"), {"email": user.email, "password": password})

    def test_admin_can_invite_sales_agent(self):
        self._login_as(self.admin)
        response = self.client.post(self.url, {"email": "newsales@example.com", "name": "New Sales", "role": "sales"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newsales@example.com", role="sales").exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("newsales@example.com", mail.outbox[0].to)

    def test_non_admin_cannot_invite(self):
        self._login_as(self.sales)
        response = self.client.post(self.url, {"email": "x@example.com", "name": "X", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_invite(self):
        response = self.client.post(self.url, {"email": "x@example.com", "name": "X", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invited_user_has_unusable_password_until_they_set_one(self):
        self._login_as(self.admin)
        self.client.post(self.url, {"email": "ops@example.com", "name": "Ops", "role": "operations"})
        invited = User.objects.get(email="ops@example.com")
        self.assertFalse(invited.has_usable_password())
