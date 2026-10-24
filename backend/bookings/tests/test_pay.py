import hashlib
import hmac
import json
import time
from datetime import date, timedelta
from io import StringIO
from itertools import count
from unittest import mock

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings import snippe
from bookings.models import Booking, Invoice, Payment
from pricing.models import Season
from safaris.models import SafariPackage

User = get_user_model()

WEBHOOK_SECRET = "whsec_test"
SNIPPE_SETTINGS = {
    "SNIPPE_API_KEY": "snp_test",
    "SNIPPE_READ_API_KEY": "snp_test_read",
    "SNIPPE_WEBHOOK_SECRET": WEBHOOK_SECRET,
    "SNIPPE_WEBHOOK_URL": "https://api.example.com/api/payments/snippe/webhook/",
    # These tests cover the hosted checkout page; test_direct_pay.py covers direct payments.
    "SNIPPE_CHECKOUT_MODE": "hosted",
}

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


class FakeSnippe:
    """Stands in for Snippe's HTTP API: records each request and answers like the docs."""

    def __init__(self):
        self.requests = []
        self.api_keys = []
        self.idempotency_keys = []
        self.sessions = {}
        self.payments = {}
        self._ids = count(1)

    def __call__(self, method, path, payload=None, idempotency_key=None, api_key=None):
        self.requests.append((method, path, payload))
        self.api_keys.append(api_key)
        self.idempotency_keys.append(idempotency_key)
        if path.startswith("/v1/payments"):
            return self._payments(method, path, payload)
        if method == "POST":
            reference = f"sess_{next(self._ids)}"
            self.sessions[reference] = {**payload, "reference": reference, "status": "pending"}
            return {
                "code": 201,
                "data": {
                    "reference": reference,
                    "checkout_url": f"https://snippe.me/checkout/{reference}",
                    "amount": payload["amount"],
                    "currency": payload["currency"],
                },
            }
        reference = path.rsplit("/", 1)[-1]
        return {"code": 200, "data": self.sessions[reference]}

    def _payments(self, method, path, payload):
        """Direct payments (/v1/payments): create, read, and re-send the prompt."""
        if method == "POST" and path.endswith("/push"):
            return {"code": 200, "data": {"reference": path.split("/")[-2], "status": "pending"}}
        if method == "POST":
            reference = f"pay_{next(self._ids)}"
            self.payments[reference] = {
                "reference": reference,
                "status": "pending",
                "amount": {"value": payload["details"]["amount"], "currency": payload["details"]["currency"]},
                "channel": {"type": "mobile_money", "provider": "airtel"},
            }
            return {"code": 201, "data": {"reference": reference, "status": "pending"}}
        return {"code": 200, "data": self.payments[path.rsplit("/", 1)[-1]]}


class SnippeTestMixin:
    """Patches Snippe's API and configures keys; `confirm` sends a signed webhook."""

    def setUp(self):
        super().setUp()
        override = override_settings(**SNIPPE_SETTINGS)
        override.enable()
        self.addCleanup(override.disable)
        self.snippe = FakeSnippe()
        patcher = mock.patch.object(snippe, "_request", self.snippe)
        patcher.start()
        self.addCleanup(patcher.stop)

    def send_webhook(self, event, secret=WEBHOOK_SECRET, timestamp=None):
        body = json.dumps(event).encode()
        timestamp = str(timestamp or int(time.time()))
        signature = hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
        return self.client.post(
            reverse("snippe-webhook"),
            data=body,
            content_type="application/json",
            HTTP_X_WEBHOOK_TIMESTAMP=timestamp,
            HTTP_X_WEBHOOK_SIGNATURE=signature,
        )

    def confirm(self, payment_id, amount=None, event_id="evt_1"):
        payment = Payment.objects.get(pk=payment_id)
        return self.send_webhook(
            {
                "id": event_id,
                "type": "payment.completed",
                "api_version": "2026-01-25",
                "data": {
                    "reference": f"pi_{payment.id}",
                    "session_reference": payment.session_reference,
                    "status": "completed",
                    "amount": {"value": payment.amount if amount is None else amount, "currency": "TZS"},
                    "metadata": {"payment_id": payment.id},
                },
            }
        )

    def pay_and_confirm(self, url, data=None):
        response = self.client.post(url, data or {})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(self.confirm(response.data["payment_id"]).status_code, status.HTTP_200_OK)
        return response


class BookingPayTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
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
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_other_tourist_cannot_pay_someone_elses_booking(self):
        # get_queryset() scopes tourists to their own bookings, so a booking that isn't
        # theirs 404s via get_object() rather than reaching the explicit 403 role check.
        self._login_as(self.other_tourist)
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_cannot_pay_on_behalf_of_a_tourist(self):
        self._login_as(self.admin)
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pay_opens_a_snippe_session_and_changes_nothing_yet(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"locale": "fr"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["checkout_url"], "https://snippe.me/checkout/sess_1")
        self.assertEqual(response.data["amount"], 20400)
        self.assertEqual(response.data["currency"], "TZS")
        _, path, payload = self.snippe.requests[0]
        self.assertEqual(path, "/api/v1/sessions")
        self.assertEqual(payload["amount"], 20400)
        self.assertEqual(payload["currency"], "TZS")
        self.assertEqual(payload["customer"], {"name": "Mark Thompson", "email": "mark@example.com"})
        self.assertEqual(payload["webhook_url"], SNIPPE_SETTINGS["SNIPPE_WEBHOOK_URL"])
        self.assertIn("/fr/booking-confirmed?booking=", payload["redirect_url"])
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_NEW_INQUIRY)
        self.assertFalse(Invoice.objects.filter(booking=self.booking).exists())
        self.assertEqual(len(mail.outbox), 0)

    def test_clicking_pay_twice_reuses_the_open_session(self):
        self._login_as(self.customer)
        first = self.client.post(self.pay_url)
        second = self.client.post(self.pay_url)
        self.assertEqual(first.data["payment_id"], second.data["payment_id"])
        self.assertEqual(len(self.snippe.requests), 1)

    def test_confirmed_payment_advances_stage_and_creates_invoice(self):
        self._login_as(self.customer)
        self.pay_and_confirm(self.pay_url)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)
        invoice = Invoice.objects.get(booking=self.booking)
        # 4 adults x 17,000, and a 30% deposit of that.
        self.assertEqual(invoice.trip_total, 68000)
        self.assertEqual(invoice.amount, 20400)
        self.assertEqual(invoice.status, Invoice.STATUS_DEPOSIT_PAID)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["mark@example.com"])

    def test_duplicate_webhook_is_applied_once(self):
        self._login_as(self.customer)
        response = self.pay_and_confirm(self.pay_url)
        self.assertEqual(self.confirm(response.data["payment_id"]).status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.filter(booking=self.booking).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_cannot_pay_after_deposit_is_recorded(self):
        self._login_as(self.customer)
        self.pay_and_confirm(self.pay_url)
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_second_paid_deposit_session_is_flagged_not_applied(self):
        self._login_as(self.customer)
        first = self.client.post(self.pay_url)
        # The first session went stale, so a second one is opened; then both get paid.
        Payment.objects.filter(pk=first.data["payment_id"]).update(created_at=timezone.now() - timedelta(hours=2))
        second = self.client.post(self.pay_url)
        self.assertNotEqual(first.data["payment_id"], second.data["payment_id"])
        self.confirm(first.data["payment_id"])
        self.confirm(second.data["payment_id"], event_id="evt_2")
        self.assertEqual(Invoice.objects.get(booking=self.booking).amount, 20400)
        self.assertTrue(Payment.objects.get(pk=second.data["payment_id"]).needs_attention)

    def test_amount_mismatch_is_not_applied(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url)
        self.confirm(response.data["payment_id"], amount=500)
        self.assertFalse(Invoice.objects.filter(booking=self.booking).exists())
        self.assertTrue(Payment.objects.get(pk=response.data["payment_id"]).needs_attention)

    def test_amounts_sent_by_the_client_are_ignored(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"amount": 1, "trip_total": 2})
        self.assertEqual(response.data["amount"], 20400)

    def test_children_pay_half_the_adult_rate(self):
        self.booking.children = 2
        self.booking.save(update_fields=["children"])
        self._login_as(self.customer)
        self.pay_and_confirm(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.trip_total, 2 * 17000 + 2 * 8500)

    def test_season_multiplier_applies_to_the_start_date(self):
        Season.objects.create(
            name="Migration peak", start_date=date(2026, 8, 1), end_date=date(2026, 9, 30), multiplier="1.25"
        )
        self._login_as(self.customer)
        self.pay_and_confirm(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.trip_total, 4 * 21250)

    def test_deposit_invoice_is_not_overdue_the_next_day(self):
        start = timezone.localdate() + timedelta(days=90)
        self.booking.start_date = start
        self.booking.end_date = start + timedelta(days=6)
        self.booking.save(update_fields=["start_date", "end_date"])
        self._login_as(self.customer)
        self.pay_and_confirm(self.pay_url)
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.due_date, start - timedelta(days=30))
        self.assertEqual(invoice.effective_status, Invoice.STATUS_DEPOSIT_PAID)

    def test_unconfigured_snippe_returns_503(self):
        self._login_as(self.customer)
        with override_settings(SNIPPE_API_KEY=""):
            response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_snippe_outage_returns_502_and_marks_payment_failed(self):
        self._login_as(self.customer)
        with mock.patch.object(snippe, "_request", side_effect=snippe.SnippeError("down")):
            response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(Payment.objects.get(booking=self.booking).status, Payment.STATUS_FAILED)


class PaymentStatusTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})
        self.payment_id = self.client.post(reverse("booking-pay", args=[self.booking.id])).data["payment_id"]
        self.url = reverse("booking-payment-status", args=[self.booking.id, self.payment_id])

    def test_pending_until_snippe_reports_completion(self):
        self.assertEqual(self.client.get(self.url).data["status"], "pending")

    def test_status_check_uses_the_read_key(self):
        self.client.get(self.url)
        self.assertEqual(self.snippe.api_keys[-1], "snp_test_read")

    def test_status_check_applies_a_payment_the_webhook_has_not_delivered(self):
        session = self.snippe.sessions["sess_1"]
        session["status"] = "completed"
        response = self.client.get(self.url)
        self.assertEqual(response.data["status"], "completed")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)

    def test_expired_session_is_reported(self):
        self.snippe.sessions["sess_1"]["status"] = "expired"
        self.assertEqual(self.client.get(self.url).data["status"], "expired")


class ReconcileOpenPaymentsTests(SnippeTestMixin, APITestCase):
    """The scheduled safety net for a webhook that never arrives."""

    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})
        self.payment_id = self.client.post(reverse("booking-pay", args=[self.booking.id])).data["payment_id"]
        self.client.logout()  # the tourist closed the tab

    def _run(self):
        out = StringIO()
        call_command("reconcile_snippe_payments", stdout=out)
        return out.getvalue()

    def test_confirms_a_payment_snippe_completed_without_a_webhook(self):
        self.snippe.sessions["sess_1"]["status"] = "completed"
        self.assertIn("1 confirmed", self._run())
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_COMPLETED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)

    def test_still_pending_is_left_alone(self):
        self.assertIn("0 confirmed", self._run())
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_PENDING)

    def test_expired_session_is_closed(self):
        self.snippe.sessions["sess_1"]["status"] = "expired"
        self.assertIn("1 failed or expired", self._run())
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_EXPIRED)

    def test_old_sessions_are_not_rechecked(self):
        Payment.objects.filter(pk=self.payment_id).update(created_at=timezone.now() - timedelta(days=3))
        requests_before = len(self.snippe.requests)
        self.assertIn("Checked 0", self._run())
        self.assertEqual(len(self.snippe.requests), requests_before)


class SnippeWebhookTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})
        self.payment_id = self.client.post(reverse("booking-pay", args=[self.booking.id])).data["payment_id"]
        self.client.logout()

    def _event(self, event_type="payment.completed"):
        payment = Payment.objects.get(pk=self.payment_id)
        return {
            "id": "evt_1",
            "type": event_type,
            "data": {
                "session_reference": payment.session_reference,
                "amount": {"value": payment.amount, "currency": "TZS"},
            },
        }

    def test_forged_signature_is_rejected(self):
        response = self.send_webhook(self._event(), secret="whsec_wrong")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Invoice.objects.filter(booking=self.booking).exists())

    def test_stale_timestamp_is_rejected(self):
        response = self.send_webhook(self._event(), timestamp=int(time.time()) - 600)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_signature_is_rejected(self):
        response = self.client.post(
            reverse("snippe-webhook"), data=self._event(), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signed_completion_needs_no_login(self):
        response = self.send_webhook(self._event())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_COMPLETED)

    def test_failed_attempt_can_still_complete_later(self):
        self.send_webhook(self._event("payment.failed"))
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_FAILED)
        self.send_webhook(self._event())
        self.assertEqual(Payment.objects.get(pk=self.payment_id).status, Payment.STATUS_COMPLETED)

    def test_unknown_session_is_acknowledged(self):
        response = self.send_webhook({"id": "evt_x", "type": "payment.completed", "data": {"session_reference": "nope"}})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PayBalanceTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer, stage=Booking.STAGE_DEPOSIT_PAID)
        self.invoice = Invoice.objects.create(
            booking=self.booking, amount=20400, trip_total=68000,
            status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 8, 2),
        )
        self.url = reverse("booking-pay-balance", args=[self.booking.id])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def test_opens_a_session_for_exactly_what_is_left(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], 47600)
        self.assertIn("/en/account?booking=", self.snippe.requests[0][2]["redirect_url"])

    def test_pays_the_rest_and_confirms(self):
        self.pay_and_confirm(self.url)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount, 68000)
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_CONFIRMED)

    def test_paying_late_does_not_move_a_completed_trip_backwards(self):
        self.booking.stage = Booking.STAGE_COMPLETED
        self.booking.save(update_fields=["stage"])
        self.pay_and_confirm(self.url)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_COMPLETED)

    def test_second_payment_is_refused(self):
        self.pay_and_confirm(self.url)
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
