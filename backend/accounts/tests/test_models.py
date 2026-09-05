from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user_defaults_to_tourist_role(self):
        user = User.objects.create_user(email="a@example.com", password="pw12345", name="A")
        self.assertEqual(user.role, "tourist")
        self.assertTrue(user.check_password("pw12345"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="pw12345")

    def test_create_superuser_forces_admin_role(self):
        admin = User.objects.create_superuser(email="root@example.com", password="pw12345")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_email_is_the_username_field(self):
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_str_returns_email(self):
        user = User.objects.create_user(email="b@example.com", password="pw12345")
        self.assertEqual(str(user), "b@example.com")
