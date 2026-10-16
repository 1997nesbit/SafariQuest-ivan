from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Invoice
from pricing.models import Season
from safaris.models import SafariPackage

User = get_user_model()


_safari_counter = [0]


def make_booking(customer, stage=Booking.STAGE_NEW_INQUIRY):
    _safari_counter[0] += 1
    safari = SafariPackage.objects.create(
        slug=f"migration-quest-{_safari_counter[0]}",
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
    return Booking.objects.create(
        customer=customer, safari=safari, stage=stage,
        start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4,
    )


class BookingPayTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.other_tourist = User.objects.create_user(
            email="other@example.com", password="pw12345", role="tourist"
        )
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.booking = make_booking(self.customer)
        self.pay_url = reverse("booking-pay", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_pay(self):
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_other_tourist_cannot_pay_someone_elses_booking(self):
        # Matches test_reviews.py's test_other_tourist_cannot_review_someone_elses_booking:
        # get_queryset() scopes tourists to their own bookings, so a booking that isn't
        # theirs 404s via get_object() rather than reaching the explicit 403 role check below.
        self._login_as(self.other_tourist)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_pay_and_stage_advances(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stage"], "deposit_paid")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)

    def test_owner_can_pay_creates_invoice_marked_deposit_paid(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        # 4 adults x $17,000, and a 30% deposit of that.
        self.assertEqual(invoice.trip_total, 68000)
        self.assertEqual(invoice.amount, 20400)
        self.assertEqual(invoice.status, Invoice.STATUS_DEPOSIT_PAID)

    def test_owner_can_pay_sends_confirmation_email_to_their_own_address(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["mark@example.com"])

    def test_cannot_pay_twice(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url, {"amount": 5100})
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Invoice.objects.filter(booking=self.booking).count(), 1)

    def test_amounts_sent_by_the_client_are_ignored(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"amount": 1, "trip_total": 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.trip_total, 68000)
        self.assertEqual(invoice.amount, 20400)

    def test_children_pay_half_the_adult_rate(self):
        self.booking.children = 2
        self.booking.save(update_fields=["children"])
        self._login_as(self.customer)
        self.client.post(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.trip_total, 2 * 17000 + 2 * 8500)

    def test_season_multiplier_applies_to_the_start_date(self):
        Season.objects.create(
            name="Migration peak", start_date=date(2026, 8, 1), end_date=date(2026, 9, 30), multiplier="1.25"
        )
        self._login_as(self.customer)
        self.client.post(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.trip_total, 4 * 21250)

    def test_deposit_invoice_is_not_overdue_the_next_day(self):
        start = timezone.localdate() + timedelta(days=90)
        self.booking.start_date = start
        self.booking.end_date = start + timedelta(days=6)
        self.booking.save(update_fields=["start_date", "end_date"])
        self._login_as(self.customer)
        self.client.post(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.due_date, start - timedelta(days=30))
        self.assertEqual(invoice.effective_status, Invoice.STATUS_DEPOSIT_PAID)

    def test_admin_cannot_pay_on_behalf_of_a_tourist(self):
        self._login_as(self.admin)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PayBalanceTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer, stage=Booking.STAGE_DEPOSIT_PAID)
        self.invoice = Invoice.objects.create(
            booking=self.booking, amount=20400, trip_total=68000,
            status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 8, 2),
        )
        self.url = reverse("booking-pay-balance", args=[self.booking.id])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def test_pays_the_rest_and_confirms(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount, 68000)
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_CONFIRMED)

    def test_paying_late_does_not_move_a_completed_trip_backwards(self):
        self.booking.stage = Booking.STAGE_COMPLETED
        self.booking.save(update_fields=["stage"])
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_COMPLETED)

    def test_second_payment_is_refused(self):
        self.client.post(self.url)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InvoiceMineTests(APITestCase):
    def setUp(self):
        self.mine_url = reverse("invoice-mine")
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.other_tourist = User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.mine_booking = make_booking(self.customer)
        self.other_booking = make_booking(self.other_tourist)
        Invoice.objects.create(
            booking=self.mine_booking, amount=5100, status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 9, 1)
        )
        Invoice.objects.create(
            booking=self.other_booking, amount=9600, status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 9, 1)
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.mine_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tourist_sees_only_their_own_invoices(self):
        self._login_as(self.customer)
        response = self.client.get(self.mine_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["amount"], 5100)
