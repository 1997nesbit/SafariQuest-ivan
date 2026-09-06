from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking
from safaris.models import SafariPackage

User = get_user_model()


class BookingNoteTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin", name="Sarah")
        customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        safari = SafariPackage.objects.create(
            slug="migration-quest",
            title="7-Day Great Migration Quest",
            image="https://example.com/image.jpg",
            image_alt="Migration",
            rating="4.9",
            days=7,
            accommodation="Luxury tented camp",
            price=17000,
            destination="Serengeti National Park",
            overview="A migration safari.",
        )
        self.booking = Booking.objects.create(
            customer=customer, safari=safari, start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4
        )
        self.notes_url = reverse("booking-notes", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_add_note_sets_author_from_request_user(self):
        self._login_as(self.admin)
        response = self.client.post(self.notes_url, {"text": "Confirmed anniversary surprise."}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["notes"]), 1)
        self.assertEqual(response.data["notes"][0]["author_name"], "Sarah")
        self.assertEqual(response.data["notes"][0]["text"], "Confirmed anniversary surprise.")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.notes.count(), 1)

    def test_note_requires_text(self):
        self._login_as(self.admin)
        response = self.client.post(self.notes_url, {"text": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_staff_cannot_add_note(self):
        tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self._login_as(tourist)
        response = self.client.post(self.notes_url, {"text": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
