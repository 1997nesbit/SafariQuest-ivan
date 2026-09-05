from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.permissions import IsAdminOrReadOnly, IsAdminRole

User = get_user_model()


class IsAdminRoleTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def test_admin_has_permission(self):
        request = self.factory.get("/")
        request.user = self.admin
        self.assertTrue(IsAdminRole().has_permission(request, None))

    def test_non_admin_denied(self):
        request = self.factory.get("/")
        request.user = self.tourist
        self.assertFalse(IsAdminRole().has_permission(request, None))


class IsAdminOrReadOnlyTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = User.objects.create_user(email="admin2@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist2@example.com", password="pw12345", role="tourist")

    def test_get_allowed_for_anyone(self):
        request = self.factory.get("/")
        request.user = self.tourist
        self.assertTrue(IsAdminOrReadOnly().has_permission(request, None))

    def test_post_requires_admin(self):
        request = self.factory.post("/")
        request.user = self.tourist
        self.assertFalse(IsAdminOrReadOnly().has_permission(request, None))

    def test_post_allowed_for_admin(self):
        request = self.factory.post("/")
        request.user = self.admin
        self.assertTrue(IsAdminOrReadOnly().has_permission(request, None))
