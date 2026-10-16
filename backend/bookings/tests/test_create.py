from datetime import date

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking
from destinations.models import Destination
from region_safaris.models import RegionSafari
from safaris.models import SafariPackage

User = get_user_model()


def make_safari(slug="migration-quest"):
    return SafariPackage.objects.create(
        slug=slug,
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


def make_region_safari(slug="morogoro-escape"):
    region = Destination.objects.create(
        slug="morogoro",
        name="Morogoro",
        images=[],
        image_alt="",
        badge="",
        tags=[],
        best_time_to_visit="",
        highlight="",
        link_label="",
        about="",
        wildlife="",
        getting_there="",
    )
    return RegionSafari.objects.create(
        slug=slug,
        region=region,
        title="Morogoro Escape",
        image="https://example.com/image.jpg",
        image_alt="Morogoro",
        rating="4.5",
        days=3,
        accommodation="Guesthouse",
        price=480,
        overview="A highlands escape.",
    )


class BookingCreateTests(APITestCase):
    def setUp(self):
        self.url = reverse("booking-list")
        self.safari = make_safari()
        self.region_safari = make_region_safari()
        self.payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "safari": self.safari.slug,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08",
            "guests": 2,
            "message": "Custom itinerary notes here.",
        }

    def test_anonymous_can_create_with_safari(self):
        response = self.client.post(self.url, self.payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.safari, self.safari)
        self.assertIsNone(booking.region_safari)
        self.assertEqual(booking.stage, Booking.STAGE_NEW_INQUIRY)
        self.assertEqual(booking.customer.email, "jane@example.com")
        self.assertEqual(booking.customer.role, "tourist")
        self.assertFalse(booking.customer.has_usable_password())

    def test_anonymous_can_create_with_region_safari(self):
        payload = dict(self.payload)
        del payload["safari"]
        payload["region_safari"] = self.region_safari.slug
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.region_safari, self.region_safari)
        self.assertIsNone(booking.safari)

    def test_requires_exactly_one_product(self):
        payload = dict(self.payload)
        payload["region_safari"] = self.region_safari.slug
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        payload = dict(self.payload)
        del payload["safari"]
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_account_gets_an_email_but_the_caller_is_not_signed_in(self):
        # The email isn't verified, so whoever typed it may not own it: they must not
        # get a session on that account. The owner claims it through the emailed link.
        response = self.client.post(self.url, self.payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("access_token", response.cookies)
        self.assertNotIn("refresh_token", response.cookies)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("jane@example.com", mail.outbox[0].to)

    def test_children_must_leave_at_least_one_adult(self):
        payload = dict(self.payload, guests=2, children=2)
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_existing_registered_account_email_is_rejected(self):
        User.objects.create_user(email="jane@example.com", password="realpassword123", role="tourist")
        response = self.client.post(self.url, self.payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # This error is raised from inside create() (after is_valid() already passed), which
        # skips DRF's normal as_serializer_error() list-wrapping — the value must already be a
        # list, or the frontend's array-shaped error parser silently drops the message and shows
        # a bare "Bad Request" instead.
        self.assertIsInstance(response.data["email"], list)
        self.assertIn("already exists", response.data["email"][0])

    def test_second_inquiry_from_unregistered_email_reuses_shell_account(self):
        first = self.client.post(self.url, self.payload)
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email="jane@example.com").count(), 1)

        second_payload = dict(self.payload, message="A second trip")
        second = self.client.post(self.url, second_payload)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email="jane@example.com").count(), 1)
        self.assertEqual(Booking.objects.filter(customer__email="jane@example.com").count(), 2)

    def test_authenticated_tourist_books_as_self_ignoring_posted_email(self):
        tourist = User.objects.create_user(email="real@example.com", password="pw12345", role="tourist")
        self.client.post(reverse("login"), {"email": "real@example.com", "password": "pw12345"})
        payload = dict(self.payload, email="someone-else@example.com")
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.customer, tourist)

    def test_end_date_before_start_date_rejected(self):
        payload = dict(self.payload, start_date="2026-10-08", end_date="2026-10-01")
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_response_shape_includes_package_and_region(self):
        response = self.client.post(self.url, self.payload)
        self.assertEqual(response.data["package_title"], self.safari.title)
        self.assertEqual(response.data["region"], self.safari.destination)
