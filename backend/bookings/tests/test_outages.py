from datetime import datetime, timedelta
from email.message import EmailMessage
from unittest import mock
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from audit.models import AuditLogEntry
from bookings import outages
from bookings.models import Payment, PaymentAttempt, PaymentOutage, SnippeNotice
from bookings.tests.test_pay import SnippeTestMixin, make_booking

User = get_user_model()
EAT = ZoneInfo("Africa/Dar_es_Salaam")

AIRTEL_BODY = (
    "Hi ivan, This is an important notification regarding your account. Please be informed that "
    "Airtel Money collections will be temporarily unavailable on Snippe due to a scheduled platform "
    "migration by Airtel Money. Maintenance Schedule: - Start: Saturday, 17 October 2026, at 5:00 PM "
    "(EAT) - End: Sunday, 18 October 2026, at 1:00 PM (EAT) During this period, Airtel Money "
    "collections will be disabled on Snippe. Other payment channels will remain available."
)
DKIM_PASS = "mx.google.com; dkim=pass header.i=@snippe.sh header.s=s1; spf=pass"


def make_email(subject, body, sender="Snippe <noreply@snippe.sh>", auth=DKIM_PASS, message_id="<n1@snippe.sh>"):
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["Message-ID"] = message_id
    message["Date"] = "Wed, 14 Oct 2026 09:00:00 +0300"
    if auth:
        message["Authentication-Results"] = auth
    message.set_content(body)
    return message.as_bytes()


class ParseNoticeTests(TestCase):
    def test_reads_snippes_maintenance_email(self):
        notice = outages.parse_notice("Scheduled Maintenance: Airtel Money Collections", AIRTEL_BODY)
        self.assertEqual(notice.kind, "outage")
        # The body mentions "other payment channels" but only the subject's network counts.
        self.assertEqual(notice.channels, ["airtel"])
        self.assertEqual(notice.starts_at, datetime(2026, 10, 17, 17, 0, tzinfo=EAT))
        self.assertEqual(notice.ends_at, datetime(2026, 10, 18, 13, 0, tzinfo=EAT))

    def test_no_network_named_means_every_channel(self):
        notice = outages.parse_notice(
            "Service disruption", "Collections are unavailable from 20 October 2026 09:00 to 20 October 2026 11:30."
        )
        self.assertEqual(notice.channels, ["all"])
        self.assertEqual(notice.ends_at, datetime(2026, 10, 20, 11, 30, tzinfo=EAT))

    def test_restored_notice(self):
        notice = outages.parse_notice("Airtel Money Collections Restored", "Back to normal.")
        self.assertEqual((notice.kind, notice.channels), ("resolved", ["airtel"]))

    def test_unrelated_email_is_ignored(self):
        self.assertIsNone(outages.parse_notice("Your monthly statement", "Here it is.").kind)

    def test_short_month_names(self):
        notice = outages.parse_notice("Planned downtime: Yas", "Start: 17 Oct 2026 22:00 End: 18 Oct. 2026 02:30")
        self.assertEqual(notice.channels, ["mixx"])
        self.assertEqual(notice.starts_at, datetime(2026, 10, 17, 22, 0, tzinfo=EAT))
        self.assertEqual(notice.ends_at, datetime(2026, 10, 18, 2, 30, tzinfo=EAT))

    def test_numeric_dates_are_day_first(self):
        notice = outages.parse_notice("Tigo maintenance", "From: 17/10/2026 22:00 To: 18/10/2026 06:00")
        self.assertEqual(notice.channels, ["mixx"])
        self.assertEqual(notice.starts_at, datetime(2026, 10, 17, 22, 0, tzinfo=EAT))
        self.assertEqual(notice.ends_at, datetime(2026, 10, 18, 6, 0, tzinfo=EAT))

    def test_iso_dates_without_labels(self):
        notice = outages.parse_notice("Service notice", "Unavailable 2026-10-20T09:00 until 2026-10-20 11:30")
        self.assertEqual(notice.starts_at, datetime(2026, 10, 20, 9, 0, tzinfo=EAT))
        self.assertEqual(notice.ends_at, datetime(2026, 10, 20, 11, 30, tzinfo=EAT))

    def test_payout_only_notice_is_not_a_collection_outage(self):
        notice = outages.parse_notice(
            "Scheduled Maintenance: Airtel Money Disbursements", "Payouts to Airtel will be unavailable."
        )
        self.assertEqual(notice.kind, "payouts_only")

    def test_notice_about_payouts_and_collections_still_counts(self):
        notice = outages.parse_notice("Scheduled Maintenance", "Airtel disbursements and collections will be unavailable.")
        self.assertEqual((notice.kind, notice.channels), ("outage", ["airtel"]))


@override_settings(SNIPPE_NOTICES_SENDER_DOMAINS=["snippe.sh"], SNIPPE_NOTICES_REQUIRE_DKIM=True)
class IngestEmailTests(TestCase):
    def test_records_a_single_network_outage_that_only_warns(self):
        outages.ingest_email(make_email("Scheduled Maintenance: Airtel Money Collections", AIRTEL_BODY))
        outage = PaymentOutage.objects.get()
        self.assertEqual(outage.channel, "airtel")
        self.assertFalse(outage.blocks_payments)
        self.assertTrue(outage.is_active)
        self.assertTrue(AuditLogEntry.objects.filter(action="payments.outage_recorded").exists())

    def test_same_email_twice_is_handled_once(self):
        raw = make_email("Scheduled Maintenance: Airtel Money Collections", AIRTEL_BODY)
        outages.ingest_email(raw)
        self.assertIsNone(outages.ingest_email(raw))
        self.assertEqual(PaymentOutage.objects.count(), 1)
        self.assertEqual(SnippeNotice.objects.count(), 1)

    def test_forged_sender_is_ignored(self):
        outages.ingest_email(make_email("Scheduled Maintenance", "All collections unavailable.", auth=None))
        outages.ingest_email(
            make_email("Scheduled Maintenance", "All unavailable.", sender="x@evil.com", message_id="<n2@evil.com>")
        )
        self.assertFalse(PaymentOutage.objects.exists())
        self.assertEqual(SnippeNotice.objects.filter(outcome__startswith="Ignored").count(), 2)

    def test_unreadable_window_is_saved_inactive_for_review(self):
        outages.ingest_email(make_email("Unplanned outage: M-Pesa", "M-Pesa collections are unavailable."))
        outage = PaymentOutage.objects.get()
        self.assertFalse(outage.is_active)
        self.assertTrue(outage.review_note)

    def test_restored_email_ends_the_current_outage(self):
        PaymentOutage.objects.create(
            channel="airtel", starts_at=timezone.now() - timedelta(hours=1), source=PaymentOutage.SOURCE_EMAIL
        )
        outages.ingest_email(make_email("Airtel Money Collections Restored", "Back to normal.", message_id="<n3@snippe.sh>"))
        self.assertFalse(PaymentOutage.objects.current().exists())


class StatusPageTests(TestCase):
    def test_major_outage_blocks_until_operational(self):
        with mock.patch.object(outages, "_fetch_component_status", return_value="MAJOROUTAGE"):
            outages.check_status_page()
            outages.check_status_page()  # still down: no second row
        self.assertEqual(PaymentOutage.objects.current().count(), 1)
        self.assertTrue(outages.payment_availability()["blocked"])
        with mock.patch.object(outages, "_fetch_component_status", return_value="OPERATIONAL"):
            outages.check_status_page()
        self.assertFalse(outages.payment_availability()["blocked"])

    def test_unreachable_status_page_changes_nothing(self):
        with mock.patch.object(outages, "_fetch_component_status", side_effect=OSError("down")):
            self.assertIsNone(outages.check_status_page())


class PayDuringOutageTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.pay_url = reverse("booking-pay", args=[self.booking.id])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def _outage(self, **fields):
        return PaymentOutage.objects.create(starts_at=timezone.now() - timedelta(minutes=5), **fields)

    def test_full_outage_refuses_payment_and_logs_it(self):
        self._outage(channel="all", blocks_payments=True, ends_at=timezone.now() + timedelta(hours=2))
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "payment_outage")
        self.assertIn("temporarily unavailable until", response.data["detail"])
        self.assertEqual(self.snippe.requests, [])
        self.assertTrue(AuditLogEntry.objects.filter(action="booking.payment_blocked_outage").exists())

    def test_single_network_outage_only_warns(self):
        self._outage(channel="airtel")
        response = self.client.post(self.pay_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        availability = self.client.get(reverse("payment-availability")).data
        self.assertFalse(availability["blocked"])
        self.assertIn("Airtel Money payments are unavailable", availability["warnings"][0])

    def test_ended_or_inactive_outages_are_ignored(self):
        self._outage(channel="all", blocks_payments=True, ends_at=timezone.now() - timedelta(minutes=1))
        self._outage(channel="all", blocks_payments=True, is_active=False)
        self.assertEqual(self.client.post(self.pay_url).status_code, status.HTTP_201_CREATED)


@override_settings(SNIPPE_FAILURE_THRESHOLD=3, SNIPPE_FAILURE_WINDOW_MINUTES=30, SNIPPE_FAILURE_MIN_PAYMENTS=2)
class DetectedOutageTests(SnippeTestMixin, APITestCase):
    """Network trouble Snippe never announced, spotted from payment.failed webhooks."""

    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})
        self.payment_ids = []
        for _ in range(3):
            booking = make_booking(self.customer)
            self.payment_ids.append(self.client.post(reverse("booking-pay", args=[booking.id])).data["payment_id"])
        self._events = 0

    def _webhook(self, payment_id, event_type="payment.failed", provider="airtel", reason="Request timed out"):
        self._events += 1
        payment = Payment.objects.get(pk=payment_id)
        data = {
            "session_reference": payment.session_reference,
            "amount": {"value": payment.amount, "currency": "TZS"},
            "channel": {"type": "mobile_money", "provider": provider},
            "failure_reason": reason,
        }
        return self.send_webhook({"id": f"evt_{self._events}", "type": event_type, "data": data})

    def _airtel_warning(self):
        return [w for w in outages.payment_availability()["warnings"] if w.startswith("Airtel")]

    def test_repeated_failures_across_payments_warn_about_that_network(self):
        for payment_id in self.payment_ids:
            self._webhook(payment_id)
        outage = PaymentOutage.objects.get(source=PaymentOutage.SOURCE_DETECTED)
        self.assertEqual(outage.channel, "airtel")
        self.assertFalse(outage.blocks_payments)
        self.assertIn("failing at the moment", self._airtel_warning()[0])
        self.assertTrue(AuditLogEntry.objects.filter(action="payments.outage_detected").exists())

    def test_one_tourist_retrying_does_not_trigger_it(self):
        for _ in range(3):
            self._webhook(self.payment_ids[0])
        self.assertFalse(PaymentOutage.objects.exists())

    def test_tourist_caused_failures_do_not_count(self):
        for payment_id in self.payment_ids:
            self._webhook(payment_id, reason="Transaction declined by user")
        self.assertFalse(PaymentOutage.objects.exists())

    def test_a_retried_webhook_counts_once(self):
        payment = Payment.objects.get(pk=self.payment_ids[0])
        event = {
            "id": "evt_same",
            "type": "payment.failed",
            "data": {"session_reference": payment.session_reference, "channel": {"provider": "airtel"}},
        }
        self.send_webhook(event)
        self.send_webhook(event)
        self.assertEqual(PaymentAttempt.objects.count(), 1)

    def test_a_success_on_that_network_ends_it(self):
        for payment_id in self.payment_ids:
            self._webhook(payment_id)
        self._webhook(self.payment_ids[0], event_type="payment.completed")
        self.assertEqual(self._airtel_warning(), [])

    def test_other_networks_are_unaffected(self):
        for payment_id in self.payment_ids:
            self._webhook(payment_id, provider="mpesa")
        self.assertEqual(PaymentOutage.objects.get().channel, "mpesa")
        self.assertEqual(self._airtel_warning(), [])
