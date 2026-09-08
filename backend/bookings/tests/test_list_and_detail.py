from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, QuoteLineItem
from guides.models import Guide
from safaris.models import SafariPackage

User = get_user_model()


def make_safari(slug, destination="Serengeti National Park"):
    return SafariPackage.objects.create(
        slug=slug,
        title="7-Day Great Migration Quest",
        image="https://example.com/image.jpg",
        image_alt="Migration",
        rating="4.9",
        days=7,
        accommodation="Luxury tented camp",
        price=17000,
        destination=destination,
        overview="A migration safari.",
    )


class BookingListDetailTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("booking-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson")
        self.guide = Guide.objects.create(name="Juma Mdoe", role="Senior Guide")
        self.safari_serengeti = make_safari("migration-quest", "Serengeti National Park")
        self.safari_zanzibar = make_safari("zanzibar-retreat", "Zanzibar Extensions")

        self.booking = Booking.objects.create(
            customer=self.customer,
            safari=self.safari_serengeti,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 7),
            guests=4,
            assigned_guide=self.guide,
            message="Family safari, big-cat viewing please.",
        )
        QuoteLineItem.objects.create(booking=self.booking, label="Vehicle", cost=2800, markup_percent=20, order=0)

        self.other_booking = Booking.objects.create(
            customer=self.customer,
            safari=self.safari_zanzibar,
            start_date=date(2026, 8, 18),
            end_date=date(2026, 8, 22),
            guests=2,
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list_bookings(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tourist_cannot_list_bookings(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_bookings(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_filters_by_region(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"region": "Zanzibar Extensions"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.other_booking.id)

    def test_list_filters_by_stage(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"stage": "new_inquiry"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_filters_by_unassigned_guide(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"guide": "unassigned"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.other_booking.id)

    def test_list_filters_by_guide_id(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"guide": self.guide.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.booking.id)

    def test_list_item_shape(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"guide": self.guide.id})
        item = response.data[0]
        self.assertEqual(item["customer_name"], "Mark Thompson")
        self.assertEqual(item["package_title"], "7-Day Great Migration Quest")
        self.assertEqual(item["region"], "Serengeti National Park")
        self.assertEqual(item["assigned_guide"], self.guide.id)
        self.assertEqual(item["assigned_guide_name"], "Juma Mdoe")
        self.assertEqual(item["subtotal"], 3360)

    def test_detail_includes_line_items_and_notes(self):
        self._login_as(self.admin)
        response = self.client.get(reverse("booking-detail", args=[self.booking.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Family safari, big-cat viewing please.")
        self.assertEqual(len(response.data["line_items"]), 1)
        self.assertEqual(response.data["line_items"][0]["quote_price"], 3360)
        self.assertEqual(response.data["notes"], [])
