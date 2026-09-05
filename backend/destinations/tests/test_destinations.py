from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class DestinationAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("destination-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.payload = {
            "slug": "arusha",
            "name": "Arusha",
            "images": ["/images/destinations/arusha-1.jpg"],
            "image_alt": "Arusha city view",
            "badge": "Safari Capital",
            "tags": ["Gateway to Northern Circuit"],
            "best_time_to_visit": "June - October",
            "highlight": "Cultural Markets",
            "link_label": "View Regional Tours",
            "about": "Arusha is the safari capital of Tanzania.",
            "wildlife": "Giraffe, buffalo, flamingos.",
            "getting_there": "Kilimanjaro International Airport is 45 minutes away.",
            "experiences": [{"name": "Coffee Tour", "description": "Walk a working estate."}],
        }

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_can_list_destinations(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create_destination(self):
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_create_destination_with_experiences(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "arusha")
        self.assertEqual(len(response.data["experiences"]), 1)
        self.assertEqual(response.data["experiences"][0]["name"], "Coffee Tour")

    def test_non_admin_cannot_create_destination(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_by_slug(self):
        self._login_as(self.admin)
        self.client.post(self.list_url, self.payload, format="json")
        response = self.client.get(reverse("destination-detail", args=["arusha"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Arusha")
