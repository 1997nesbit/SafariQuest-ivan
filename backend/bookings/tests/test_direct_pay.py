"""Direct payments: the tourist enters their phone number on this site and approves the
prompt Snippe sends to it (SNIPPE_CHECKOUT_MODE="direct")."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings import mobile_numbers
from bookings.models import Booking, Invoice, Payment, PaymentAttempt, PaymentOutage
from bookings.tests.test_pay import SnippeTestMixin, make_booking

User = get_user_model()


class MobileNumberTests(SimpleTestCase):
    def test_normalizes_the_ways_people_write_a_number(self):
        for raw in ("0754 123 456", "+255 754 123 456", "255754123456", "754123456", "0754-123-456"):
            self.assertEqual(mobile_numbers.normalize(raw), "255754123456", raw)

    def test_rejects_what_isnt_a_tanzanian_mobile_number(self):
        for raw in ("", "12345", "0254123456", "07541234567", "+254 712 345 678"):
            self.assertIsNone(mobile_numbers.normalize(raw), raw)

    def test_network_by_prefix(self):
        cases = {"0754123456": "mpesa", "0784123456": "airtel", "0713123456": "mixx", "0621123456": "halotel"}
        for raw, channel in cases.items():
            self.assertEqual(mobile_numbers.network_for(mobile_numbers.normalize(raw)), channel, raw)
        # TTCL (T-Pesa) isn't offered by Snippe.
        self.assertIsNone(mobile_numbers.network_for(mobile_numbers.normalize("0733123456")))

    def test_masked(self):
        self.assertEqual(mobile_numbers.masked("255754123456"), "0754 *** 456")


class DirectPayTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        direct = override_settings(SNIPPE_CHECKOUT_MODE="direct")
        direct.enable()
        self.addCleanup(direct.disable)
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.booking = make_booking(self.customer)
        self.pay_url = reverse("booking-pay", args=[self.booking.id])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def _pay(self, phone="0784 123 456"):
        return self.client.post(self.pay_url, {"phone_number": phone})

    def _status(self, payment_id):
        return self.client.get(reverse("booking-payment-status", args=[self.booking.id, payment_id]))

    def test_sends_the_prompt_to_the_phone_and_changes_nothing_yet(self):
        response = self._pay()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["mode"], "direct")
        self.assertEqual(response.data["phone_masked"], "0784 *** 456")
        self.assertEqual(response.data["checkout_url"], "")
        method, path, payload = self.snippe.requests[0]
        self.assertEqual((method, path), ("POST", "/v1/payments"))
        self.assertEqual(payload["phone_number"], "255784123456")
        self.assertEqual(payload["details"], {"amount": 20400, "currency": "TZS"})
        self.assertEqual(payload["customer"], {"firstname": "Mark", "lastname": "Thompson", "email": "mark@example.com"})
        self.assertEqual(payload["webhook_url"], "https://api.example.com/api/payments/snippe/webhook/")
        self.assertLessEqual(len(self.snippe.idempotency_keys[0]), 30)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_NEW_INQUIRY)

    def test_invalid_or_unsupported_numbers_never_reach_snippe(self):
        for phone, code in (("", "invalid_phone"), ("12345", "invalid_phone"), ("0733123456", "unsupported_network")):
            response = self._pay(phone)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, phone)
            self.assertEqual(response.data["code"], code, phone)
        self.assertEqual(self.snippe.requests, [])

    def test_a_number_on_a_network_thats_down_is_turned_away(self):
        PaymentOutage.objects.create(channel="airtel", starts_at=timezone.now() - timedelta(minutes=5))
        response = self._pay("0784 123 456")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "network_outage")
        self.assertIn("Airtel Money", response.data["detail"])
        self.assertEqual(self._pay("0754 123 456").status_code, status.HTTP_201_CREATED)

    def test_status_check_completes_the_payment(self):
        payment_id = self._pay().data["payment_id"]
        reference = Payment.objects.get(pk=payment_id).session_reference
        self.snippe.payments[reference]["status"] = "completed"
        self.assertEqual(self._status(payment_id).data["status"], "completed")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)
        self.assertEqual(Invoice.objects.get(booking=self.booking).amount, 20400)
        # Fed to outage detection exactly once, even if the webhook arrives too.
        self.assertEqual(PaymentAttempt.objects.filter(payment_id=payment_id).count(), 1)
        self.confirm(payment_id)
        self.assertEqual(PaymentAttempt.objects.filter(payment_id=payment_id).count(), 1)

    def test_a_failed_payment_is_final_and_paying_again_sends_a_new_prompt(self):
        first = self._pay().data["payment_id"]
        self.snippe.payments[Payment.objects.get(pk=first).session_reference]["status"] = "failed"
        self.assertEqual(self._status(first).data["status"], "failed")
        second = self._pay().data["payment_id"]
        self.assertNotEqual(first, second)

    def test_double_click_reuses_the_prompt_already_sent(self):
        first = self._pay().data["payment_id"]
        second = self._pay().data["payment_id"]
        self.assertEqual(first, second)
        self.assertEqual(sum(1 for m, p, _ in self.snippe.requests if (m, p) == ("POST", "/v1/payments")), 1)

    def test_a_different_number_sends_a_new_prompt(self):
        first = self._pay("0784 123 456").data["payment_id"]
        second = self._pay("0754 123 456").data["payment_id"]
        self.assertNotEqual(first, second)

    def test_resend_pushes_the_prompt_again(self):
        payment_id = self._pay().data["payment_id"]
        url = reverse("booking-resend-prompt", args=[self.booking.id, payment_id])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        self.assertTrue(self.snippe.requests[-1][1].endswith("/push"))
        Payment.objects.filter(pk=payment_id).update(status=Payment.STATUS_COMPLETED)
        self.assertEqual(self.client.post(url).status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_matches_a_direct_payment_by_its_reference(self):
        payment_id = self._pay().data["payment_id"]
        payment = Payment.objects.get(pk=payment_id)
        response = self.send_webhook(
            {
                "id": "evt_direct",
                "type": "payment.completed",
                "data": {
                    "reference": payment.session_reference,
                    "amount": {"value": payment.amount, "currency": "TZS"},
                    "channel": {"provider": "airtel"},
                },
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.get(pk=payment_id).status, Payment.STATUS_COMPLETED)

    def test_balance_is_paid_directly_too(self):
        self.booking.stage = Booking.STAGE_DEPOSIT_PAID
        self.booking.save(update_fields=["stage"])
        Invoice.objects.create(
            booking=self.booking, amount=20400, trip_total=68000, status=Invoice.STATUS_DEPOSIT_PAID,
            due_date=timezone.localdate() + timedelta(days=30),
        )
        response = self.client.post(
            reverse("booking-pay-balance", args=[self.booking.id]), {"phone_number": "0621 123 456"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["amount"], 47600)
        self.assertEqual(self.snippe.requests[0][2]["phone_number"], "255621123456")

    def test_availability_tells_the_site_which_mode_is_on(self):
        self.assertEqual(self.client.get(reverse("payment-availability")).data["mode"], "direct")
        with override_settings(SNIPPE_CHECKOUT_MODE="hosted"):
            self.assertEqual(self.client.get(reverse("payment-availability")).data["mode"], "hosted")
