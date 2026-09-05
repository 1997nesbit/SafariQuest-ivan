from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SetPasswordViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("set-password")
        self.user = User.objects.create_user(email="invited@example.com", role="operations")
        self.user.set_unusable_password()
        self.user.save()
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

    def test_valid_token_sets_password_and_signs_in(self):
        response = self.client.post(self.url, {"uid": self.uid, "token": self.token, "password": "brand-new-pw-123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "operations"})
        self.assertIn(settings.AUTH_COOKIE_ACCESS, response.cookies)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brand-new-pw-123"))

    def test_invalid_token_returns_400(self):
        response = self.client.post(self.url, {"uid": self.uid, "token": "garbage-token", "password": "brand-new-pw-123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_uid_returns_400(self):
        response = self.client.post(self.url, {"uid": "not-a-real-uid", "token": self.token, "password": "brand-new-pw-123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_cannot_be_reused_after_password_changes(self):
        self.client.post(self.url, {"uid": self.uid, "token": self.token, "password": "brand-new-pw-123"})
        response = self.client.post(self.url, {"uid": self.uid, "token": self.token, "password": "second-attempt-pw"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
