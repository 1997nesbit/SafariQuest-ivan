from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from promotions.models import Promotion

User = get_user_model()

VALID = {
    "title": "Kili Marathon 2027",
    "image": "https://example.com/marathon.jpg",
    "description": "Pande will be sponsoring. Call to get your ticket at a 20% discount.",
    "phone": "+255 725 377 625",
    "order": 0,
    "is_published": True,
}


def make_promotion(**overrides):
    fields = {**VALID, **overrides}
    return Promotion.objects.create(**fields)


class PromotionVisibilityTests(APITestCase):
    def setUp(self):
        self.url = reverse("promotion-list")
        self.live = make_promotion(title="Live event")
        self.draft = make_promotion(title="Draft event", is_published=False)

    def test_visitor_sees_only_published_events(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.json()]
        self.assertEqual(titles, ["Live event"])

    def test_admin_list_includes_drafts_only_when_asked(self):
        admin = User.objects.create_user(email="admin@example.com", password="x", role=User.ROLE_ADMIN)
        self.client.force_authenticate(user=admin)
        default_titles = [item["title"] for item in self.client.get(self.url).json()]
        self.assertEqual(default_titles, ["Live event"])
        all_titles = [item["title"] for item in self.client.get(self.url, {"all": "true"}).json()]
        self.assertEqual(sorted(all_titles), ["Draft event", "Live event"])

    def test_no_click_tracking_endpoint_exists(self):
        response = self.client.post(f"/api/promotions/{self.live.pk}/click/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PromotionWriteTests(APITestCase):
    def setUp(self):
        self.url = reverse("promotion-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="x", role=User.ROLE_ADMIN)

    def test_anonymous_cannot_create(self):
        response = self.client.post(self.url, VALID, format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_admin_creates_event(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, VALID, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Promotion.objects.get().phone, "+255 725 377 625")

    def test_rejects_non_web_image_scheme(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, {**VALID, "image": "ftp://example.com/a.jpg"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.json())

    def test_rejects_phone_that_is_not_a_number(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, {**VALID, "phone": "call us now"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.json())

    def test_rejects_blank_title(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, {**VALID, "title": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.json())
