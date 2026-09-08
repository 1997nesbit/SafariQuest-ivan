from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase

from bookings.models import Booking, BookingNote, QuoteLineItem
from guides.models import Guide
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


class BookingModelTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.safari = make_safari()
        self.booking = Booking.objects.create(
            customer=self.customer,
            safari=self.safari,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 7),
            guests=4,
        )

    def test_stage_defaults_to_new_inquiry(self):
        self.assertEqual(self.booking.stage, Booking.STAGE_NEW_INQUIRY)

    def test_stage_order_is_the_fixed_pipeline_sequence(self):
        self.assertEqual(
            Booking.STAGE_ORDER,
            [
                Booking.STAGE_NEW_INQUIRY,
                Booking.STAGE_QUOTED,
                Booking.STAGE_DEPOSIT_PAID,
                Booking.STAGE_CONFIRMED,
                Booking.STAGE_COMPLETED,
            ],
        )

    def test_quote_line_item_price_applies_markup_and_rounds(self):
        item = QuoteLineItem.objects.create(booking=self.booking, label="Vehicle", cost=2800, markup_percent=20, order=0)
        self.assertEqual(item.quote_price, 3360)

    def test_booking_subtotal_sums_all_line_items(self):
        QuoteLineItem.objects.create(booking=self.booking, label="Vehicle", cost=2800, markup_percent=20, order=0)
        QuoteLineItem.objects.create(booking=self.booking, label="Camp", cost=9600, markup_percent=15, order=1)
        self.assertEqual(self.booking.subtotal, 3360 + 11040)

    def test_booking_with_no_line_items_has_zero_subtotal(self):
        self.assertEqual(self.booking.subtotal, 0)

    def test_note_records_author_and_text(self):
        note = BookingNote.objects.create(booking=self.booking, author=self.customer, text="Anniversary on day 5.")
        self.assertEqual(note.booking, self.booking)
        self.assertEqual(note.text, "Anniversary on day 5.")

    def test_assigned_guide_optional(self):
        self.assertIsNone(self.booking.assigned_guide)
        guide = Guide.objects.create(name="Juma Mdoe", role="Senior Guide")
        self.booking.assigned_guide = guide
        self.booking.save()
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.assigned_guide, guide)
