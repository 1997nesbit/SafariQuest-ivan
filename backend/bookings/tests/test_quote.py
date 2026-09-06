from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, QuoteLineItem
from safaris.models import SafariPackage

User = get_user_model()


class QuoteUpdateTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
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
        QuoteLineItem.objects.create(booking=self.booking, label="Old item", cost=100, markup_percent=10, order=0)
        self.quote_url = reverse("booking-quote", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_replaces_line_items_and_returns_subtotal(self):
        self._login_as(self.admin)
        payload = {
            "line_items": [
                {"label": "Vehicle & driver-guide (7 days)", "cost": 2800, "markup_percent": 20},
                {"label": "Luxury tented camp", "cost": 9600, "markup_percent": 15},
            ]
        }
        response = self.client.patch(self.quote_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["line_items"]), 2)
        self.assertEqual(response.data["subtotal"], 3360 + 11040)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.line_items.count(), 2)
        self.assertFalse(self.booking.line_items.filter(label="Old item").exists())

    def test_rejects_negative_cost(self):
        self._login_as(self.admin)
        payload = {"line_items": [{"label": "Vehicle", "cost": -100, "markup_percent": 20}]}
        response = self.client.patch(self.quote_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_staff_cannot_update_quote(self):
        tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self._login_as(tourist)
        response = self.client.patch(self.quote_url, {"line_items": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
