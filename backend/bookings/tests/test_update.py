from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking
from guides.models import Guide
from safaris.models import SafariPackage

User = get_user_model()


class BookingUpdateTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson")
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
        self.guide = Guide.objects.create(name="Juma Mdoe", role="Senior Guide")
        self.booking = Booking.objects.create(
            customer=customer, safari=safari, start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4
        )
        self.detail_url = reverse("booking-detail", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_assign_guide(self):
        self._login_as(self.admin)
        response = self.client.patch(self.detail_url, {"assigned_guide": self.guide.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["assigned_guide"], self.guide.id)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.assigned_guide, self.guide)

    def test_cannot_set_stage_to_quoted_directly(self):
        self._login_as(self.admin)
        response = self.client.patch(self.detail_url, {"stage": "quoted"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, "new_inquiry")

    def test_cannot_skip_stages(self):
        self._login_as(self.admin)
        response = self.client.patch(self.detail_url, {"stage": "confirmed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_move_backward(self):
        self.booking.stage = Booking.STAGE_DEPOSIT_PAID
        self.booking.save()
        self._login_as(self.admin)
        response = self.client.patch(self.detail_url, {"stage": "new_inquiry"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_forward_transition_succeeds(self):
        self.booking.stage = Booking.STAGE_QUOTED
        self.booking.save()
        self._login_as(self.admin)
        response = self.client.patch(self.detail_url, {"stage": "deposit_paid"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stage"], "deposit_paid")

    def test_non_staff_cannot_update(self):
        tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self._login_as(tourist)
        response = self.client.patch(self.detail_url, {"assigned_guide": self.guide.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
