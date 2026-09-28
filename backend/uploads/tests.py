import secrets

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .views import MAX_UPLOAD_BYTES, detect_image_extension

User = get_user_model()

# Generated per run rather than a literal in the source — these accounts only exist for
# the duration of a test, so there's no reason for a credential-shaped string to live here.
TEST_PASSWORD = secrets.token_urlsafe(12)

# The smallest real file of each format — only the leading bytes matter here.
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
GIF = b"GIF89a" + b"\x00" * 32
WEBP = b"RIFF\x24\x00\x00\x00WEBP" + b"\x00" * 32


class DetectImageExtensionTests(APITestCase):
    def test_recognises_each_supported_format_from_its_bytes(self):
        self.assertEqual(detect_image_extension(PNG[:12]), "png")
        self.assertEqual(detect_image_extension(JPEG[:12]), "jpg")
        self.assertEqual(detect_image_extension(GIF[:12]), "gif")
        self.assertEqual(detect_image_extension(WEBP[:12]), "webp")

    def test_rejects_other_content(self):
        self.assertIsNone(detect_image_extension(b"<svg xmlns=..."))
        self.assertIsNone(detect_image_extension(b"<!DOCTYPE html"))
        self.assertIsNone(detect_image_extension(b"RIFF\x24\x00\x00\x00WAVE"))  # RIFF, but not WebP
        self.assertIsNone(detect_image_extension(b""))


class ImageUploadTests(APITestCase):
    def setUp(self):
        self.url = reverse("image-upload")
        self.admin = User.objects.create_user(email="admin@example.com", password=TEST_PASSWORD, role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password=TEST_PASSWORD, role="tourist")

    def _upload(self, content, name="photo.png", content_type="image/png"):
        return self.client.post(
            self.url, {"file": SimpleUploadedFile(name, content, content_type=content_type)}, format="multipart"
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": TEST_PASSWORD})

    def test_anonymous_and_non_admin_cannot_upload(self):
        self.assertEqual(self._upload(PNG).status_code, status.HTTP_401_UNAUTHORIZED)
        self._login_as(self.tourist)
        self.assertEqual(self._upload(PNG).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_uploads_a_real_image(self):
        self._login_as(self.admin)
        response = self._upload(PNG)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["url"].endswith(".png"))

    def test_html_disguised_as_png_is_rejected(self):
        """The reason for sniffing bytes: the Content-Type here is a lie."""
        self._login_as(self.admin)
        response = self._upload(b"<html><script>alert(1)</script></html>", "evil.png", "image/png")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_svg_is_rejected_even_when_labelled_as_an_image(self):
        self._login_as(self.admin)
        response = self._upload(b"<svg xmlns='http://www.w3.org/2000/svg'></svg>", "x.png", "image/png")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stored_extension_follows_the_bytes_not_the_filename(self):
        self._login_as(self.admin)
        response = self._upload(JPEG, "actually-a-jpeg.png", "image/png")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["url"].endswith(".jpg"))

    def test_missing_file_is_rejected(self):
        self._login_as(self.admin)
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_file_is_rejected(self):
        self._login_as(self.admin)
        response = self._upload(PNG + b"\x00" * MAX_UPLOAD_BYTES)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
