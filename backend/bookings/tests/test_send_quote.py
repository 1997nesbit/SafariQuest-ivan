from datetime import date

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, QuoteLineItem
from safaris.models import SafariPackage

User = get_user_model()


class SendQuoteTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
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
            customer=self.customer, safari=safari, start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4
        )
        QuoteLineItem.objects.create(booking=self.booking, label="Vehicle", cost=2800, markup_percent=20, order=0)
        self.send_url = reverse("booking-quote-send", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_sends_quote_and_advances_stage(self):
        self._login_as(self.admin)
        response = self.client.post(self.send_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stage"], "quoted")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_QUOTED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["mark@example.com"])

    def test_resending_while_already_quoted_is_allowed(self):
        self.booking.stage = Booking.STAGE_QUOTED
        self.booking.save()
        self._login_as(self.admin)
        response = self.client.post(self.send_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

    def test_rejected_without_line_items(self):
        self.booking.line_items.all().delete()
        self._login_as(self.admin)
        response = self.client.post(self.send_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)

    def test_rejected_once_deposit_paid(self):
        self.booking.stage = Booking.STAGE_DEPOSIT_PAID
        self.booking.save()
        self._login_as(self.admin)
        response = self.client.post(self.send_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
