from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Invoice, QuoteLineItem
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
    booking = Booking.objects.create(
        customer=customer, safari=safari, stage=stage,
        start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4,
    )
    QuoteLineItem.objects.create(booking=booking, label="Vehicle", quantity=1, unit_price=3360, order=0)
    return booking


class InvoiceCreationOnSendQuoteTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_sending_a_quote_issues_an_invoice(self):
        self._login_as(self.admin)
        self.client.post(reverse("booking-quote-send", args=[self.booking.id]))
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.amount, self.booking.subtotal)
        self.assertEqual(invoice.status, Invoice.STATUS_UNPAID)
        self.assertEqual(invoice.due_date, timezone.localdate() + timedelta(days=14))

    def test_resending_a_quote_does_not_duplicate_the_invoice(self):
        self._login_as(self.admin)
        url = reverse("booking-quote-send", args=[self.booking.id])
        self.client.post(url)
        self.client.post(url)
        self.assertEqual(Invoice.objects.filter(booking=self.booking).count(), 1)

    def test_edited_quote_updates_the_unpaid_invoice(self):
        self._login_as(self.admin)
        self.client.post(reverse("booking-quote-send", args=[self.booking.id]))
        self.client.patch(
            reverse("booking-quote", args=[self.booking.id]),
            {"line_items": [{"label": "Vehicle", "quantity": 2, "unit_price": 3360}]},
            format="json",
        )
        self.client.post(reverse("booking-quote-send", args=[self.booking.id]))
        self.assertEqual(Invoice.objects.get(booking=self.booking).amount, 6720)

    def test_quote_cannot_be_edited_once_a_deposit_is_paid(self):
        self._login_as(self.admin)
        self.booking.stage = Booking.STAGE_DEPOSIT_PAID
        self.booking.save(update_fields=["stage"])
        response = self.client.patch(
            reverse("booking-quote", args=[self.booking.id]),
            {"line_items": [{"label": "Vehicle", "quantity": 2, "unit_price": 3360}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InvoiceAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("invoice-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.booking = make_booking(self.customer, stage=Booking.STAGE_QUOTED)
        self.invoice = Invoice.objects.create(
            booking=self.booking, amount=3360, due_date=timezone.localdate() + timedelta(days=14)
        )
        self.overdue_booking = make_booking(self.customer, stage=Booking.STAGE_QUOTED)
        self.overdue_invoice = Invoice.objects.create(
            booking=self.overdue_booking, amount=1000, due_date=timezone.localdate() - timedelta(days=5)
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_non_admin_cannot_list(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lists_invoices(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated (config.pagination.StandardPagination): count + results.
        self.assertEqual(response.data["count"], 2)

    def test_effective_status_computes_overdue(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"status": "overdue"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        result = response.data["results"][0]
        self.assertEqual(result["id"], self.overdue_invoice.id)
        self.assertEqual(result["status"], "overdue")
        self.assertEqual(result["customer_name"], "Mark Thompson")

    def test_status_filter_excludes_an_overdue_invoice_from_unpaid(self):
        """An invoice that is status=unpaid but past its due date is "overdue",
        not "unpaid" - ?status=unpaid must not also return it."""
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"status": "unpaid"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([inv["id"] for inv in response.data["results"]], [self.invoice.id])

    def test_status_filter_paid_matches_regardless_of_due_date(self):
        self.overdue_invoice.status = Invoice.STATUS_PAID
        self.overdue_invoice.save()
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"status": "paid"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([inv["id"] for inv in response.data["results"]], [self.overdue_invoice.id])

    def test_status_filter_unknown_value_returns_nothing(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"status": "bogus"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_status_filter_does_not_load_every_invoice_into_python(self):
        """Pins the SQL rewrite: filtering by status used to be
        `[inv for inv in queryset if inv.effective_status == status_param]`,
        one Python-side evaluation per row. A fixed, small query count proves
        that's gone regardless of how many invoices exist."""
        self._login_as(self.admin)
        for i in range(20):
            booking = make_booking(self.customer, stage=Booking.STAGE_QUOTED)
            Invoice.objects.create(
                booking=booking, amount=1000, due_date=timezone.localdate() + timedelta(days=14)
            )
        from django.test.utils import CaptureQueriesContext
        from django.db import connection
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.list_url, {"status": "unpaid"})
        # Fixed and small regardless of row count is the property under test;
        # the exact number is whatever cookie-JWT auth plus the paginated list
        # SELECT (+ its COUNT) costs today, printed here so a future change to
        # any of those has an honest baseline to update rather than a guessed one.
        self.assertLessEqual(len(ctx.captured_queries), 6, ctx.captured_queries)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 21)  # under page_size=25, one page

    def test_invoice_list_is_paginated(self):
        self._login_as(self.admin)
        for i in range(24):
            booking = make_booking(self.customer, stage=Booking.STAGE_QUOTED)
            Invoice.objects.create(
                booking=booking, amount=1000, due_date=timezone.localdate() + timedelta(days=14)
            )
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 26)  # 2 from setUp + 24 here
        self.assertEqual(len(response.data["results"]), 25)  # StandardPagination.page_size
        self.assertIsNotNone(response.data["next"])

    def test_retrieve_includes_line_items(self):
        self._login_as(self.admin)
        response = self.client.get(reverse("invoice-detail", args=[self.invoice.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["line_items"]), 1)

    def test_admin_marks_invoice_paid(self):
        self._login_as(self.admin)
        response = self.client.patch(reverse("invoice-detail", args=[self.invoice.id]), {"status": "paid"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)

    def test_paid_invoice_is_never_overdue(self):
        self.overdue_invoice.status = Invoice.STATUS_PAID
        self.overdue_invoice.save()
        self.assertFalse(self.overdue_invoice.is_overdue)

    def test_send_reminder_emails_customer(self):
        self._login_as(self.admin)
        response = self.client.post(reverse("invoice-remind", args=[self.overdue_invoice.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["mark@example.com"])


class FinanceSummaryTests(APITestCase):
    def setUp(self):
        self.url = reverse("finance-summary")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")

        paid_booking = make_booking(customer, stage=Booking.STAGE_CONFIRMED)
        Invoice.objects.create(
            booking=paid_booking, amount=1000, status=Invoice.STATUS_PAID,
            due_date=timezone.localdate() + timedelta(days=14),
        )
        overdue_booking = make_booking(customer, stage=Booking.STAGE_QUOTED)
        Invoice.objects.create(
            booking=overdue_booking, amount=500, due_date=timezone.localdate() - timedelta(days=3)
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_non_admin_forbidden(self):
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_summary_totals(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tzs = response.data["by_currency"]["TZS"]
        self.assertEqual(tzs["total_invoiced"], 1500)
        self.assertEqual(tzs["total_collected"], 1000)
        self.assertEqual(tzs["total_outstanding"], 500)
        self.assertEqual(tzs["overdue_amount"], 500)
        self.assertEqual(response.data["overdue_count"], 1)

    def test_checkout_deposit_counts_as_collected_and_the_trip_as_invoiced(self):
        customer = User.objects.get(email="mark@example.com")
        Invoice.objects.create(
            booking=make_booking(customer, stage=Booking.STAGE_DEPOSIT_PAID),
            amount=3000, trip_total=10000, status=Invoice.STATUS_DEPOSIT_PAID,
            due_date=timezone.localdate() + timedelta(days=30),
        )
        self._login_as(self.admin)
        response = self.client.get(self.url)
        tzs = response.data["by_currency"]["TZS"]
        self.assertEqual(tzs["total_invoiced"], 1500 + 10000)
        self.assertEqual(tzs["total_collected"], 1000 + 3000)
        self.assertEqual(tzs["total_outstanding"], 500 + 7000)
        self.assertEqual(response.data["overdue_count"], 1)

    def test_usd_invoices_are_totalled_separately(self):
        customer = User.objects.get(email="mark@example.com")
        usd_booking = make_booking(customer, stage=Booking.STAGE_DEPOSIT_PAID)
        usd_booking.currency = "USD"
        usd_booking.save(update_fields=["currency"])
        Invoice.objects.create(
            booking=usd_booking, amount=900, trip_total=3000, status=Invoice.STATUS_DEPOSIT_PAID,
            due_date=timezone.localdate() + timedelta(days=30),
        )
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.data["by_currency"]["TZS"]["total_invoiced"], 1500)
        usd = response.data["by_currency"]["USD"]
        self.assertEqual((usd["total_invoiced"], usd["total_collected"], usd["total_outstanding"]), (3000, 900, 2100))
