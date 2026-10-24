"""Two currencies: a booking is priced and paid in TZS (Snippe) or USD (Senjaropay), chosen
at checkout, and amounts in the two are never added together."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.currency import format_amount, product_price
from bookings.models import Booking, Payment
from bookings.pricing import deposit_for, trip_total_for
from bookings.tests.test_create import make_safari, trip_day
from bookings.tests.test_pay import SnippeTestMixin, make_booking

User = get_user_model()


class ProductPriceTests(APITestCase):
    def test_tzs_is_the_price_and_usd_is_optional(self):
        safari = make_safari()
        self.assertEqual(product_price(safari, "TZS"), 17000)
        self.assertIsNone(product_price(safari, "USD"))
        safari.price_usd = 6800
        self.assertEqual(product_price(safari, "USD"), 6800)

    def test_format_amount(self):
        self.assertEqual(format_amount(1200000, "TZS"), "TZS 1,200,000")
        self.assertEqual(format_amount(3400, "USD"), "USD 3,400")


class BookingCurrencyTests(APITestCase):
    def setUp(self):
        self.url = reverse("booking-list")
        self.safari = make_safari()
        self.payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "safari": self.safari.slug,
            "start_date": trip_day(0),
            "end_date": trip_day(7),
            "guests": 2,
        }

    def test_defaults_to_tzs(self):
        response = self.client.post(self.url, self.payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Booking.objects.get(pk=response.data["id"]).currency, "TZS")
        self.assertEqual(response.data["currency"], "TZS")

    def test_usd_needs_the_trip_to_have_a_usd_price(self):
        response = self.client.post(self.url, {**self.payload, "currency": "USD"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("currency", response.data)

    def test_usd_booking_is_priced_from_the_usd_price(self):
        self.safari.price_usd = 6800
        self.safari.save(update_fields=["price_usd"])
        response = self.client.post(self.url, {**self.payload, "currency": "USD"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.currency, "USD")
        self.assertEqual(trip_total_for(booking), 2 * 6800)
        self.assertEqual(deposit_for(trip_total_for(booking)), 4080)

    def test_unknown_currency_is_refused(self):
        response = self.client.post(self.url, {**self.payload, "currency": "EUR"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UsdPaymentTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.booking.currency = "USD"
        self.booking.save(update_fields=["currency"])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def test_usd_is_refused_until_senjaropay_is_connected(self):
        response = self.client.post(reverse("booking-pay", args=[self.booking.id]))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "provider_unavailable")
        self.assertEqual(self.snippe.requests, [])
        self.assertFalse(Payment.objects.exists())

    def test_availability_reports_which_currencies_can_be_paid(self):
        currencies = self.client.get(reverse("payment-availability")).data["currencies"]
        self.assertEqual(currencies, {"TZS": True, "USD": False})

    def test_tzs_payment_records_its_currency_and_provider(self):
        self.booking.currency = "TZS"
        self.booking.save(update_fields=["currency"])
        payment_id = self.client.post(reverse("booking-pay", args=[self.booking.id])).data["payment_id"]
        payment = Payment.objects.get(pk=payment_id)
        self.assertEqual((payment.currency, payment.provider), ("TZS", "snippe"))
