from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SafariPackageAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("safari-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.payload = {
            "slug": "great-migration-path",
            "title": "Great Migration Path",
            "image": "https://example.com/lions.jpg",
            "image_alt": "A pride of lions in golden grass.",
            "rating": "4.9",
            "days": 8,
            "accommodation": "Luxury Tents",
            "price": 4250,
            "badge": "Most Popular",
            "signature": True,
            "destination": "Serengeti National Park",
            "overview": "Follow the herds across the Serengeti's endless plains.",
            "highlights": ["Great Migration river crossings"],
            "included": ["Private 4x4 Land Cruiser & driver-guide"],
            "excluded": ["International flights"],
            "itinerary": [
                {"day": 1, "title": "Arrival in Arusha", "description": "Airport pickup and transfer."},
                {"day": 2, "title": "Serengeti North", "description": "Fly to the northern Serengeti."},
            ],
        }

    def _login_as_admin(self):
        self.client.post(reverse("login"), {"email": self.admin.email, "password": "pw12345"})

    def test_anonymous_can_list_safaris(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_create_safari_with_itinerary(self):
        self._login_as_admin()
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["itinerary"]), 2)
        self.assertEqual(response.data["itinerary"][0]["title"], "Arrival in Arusha")

    def test_anonymous_cannot_create_safari(self):
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_itinerary_days_are_ordered(self):
        self._login_as_admin()
        payload = dict(self.payload)
        payload["slug"] = "reordered"
        payload["itinerary"] = [
            {"day": 2, "title": "Second", "description": "d2"},
            {"day": 1, "title": "First", "description": "d1"},
        ]
        self.client.post(self.list_url, payload, format="json")
        response = self.client.get(reverse("safari-detail", args=["reordered"]))
        self.assertEqual([d["day"] for d in response.data["itinerary"]], [1, 2])
