from django.conf import settings
from django.db import models


class Booking(models.Model):
    STAGE_NEW_INQUIRY = "new_inquiry"
    STAGE_QUOTED = "quoted"
    STAGE_DEPOSIT_PAID = "deposit_paid"
    STAGE_CONFIRMED = "confirmed"
    STAGE_COMPLETED = "completed"

    STAGE_CHOICES = [
        (STAGE_NEW_INQUIRY, "New Inquiry"),
        (STAGE_QUOTED, "Quoted"),
        (STAGE_DEPOSIT_PAID, "Deposit Paid"),
        (STAGE_CONFIRMED, "Confirmed"),
        (STAGE_COMPLETED, "Completed"),
    ]

    STAGE_ORDER = [
        STAGE_NEW_INQUIRY,
        STAGE_QUOTED,
        STAGE_DEPOSIT_PAID,
        STAGE_CONFIRMED,
        STAGE_COMPLETED,
    ]

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="bookings", on_delete=models.PROTECT
    )
    safari = models.ForeignKey(
        "safaris.SafariPackage", related_name="bookings", null=True, blank=True, on_delete=models.PROTECT
    )
    region_safari = models.ForeignKey(
        "region_safaris.RegionSafari", related_name="bookings", null=True, blank=True, on_delete=models.PROTECT
    )
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default=STAGE_NEW_INQUIRY)
    start_date = models.DateField()
    end_date = models.DateField()
    guests = models.PositiveIntegerField()
    # How many of `guests` are children, who pay half the adult rate (bookings.pricing).
    children = models.PositiveIntegerField(default=0)
    assigned_guide = models.ForeignKey(
        "guides.Guide", related_name="bookings", null=True, blank=True, on_delete=models.SET_NULL
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(safari__isnull=False, region_safari__isnull=True)
                    | models.Q(safari__isnull=True, region_safari__isnull=False)
                ),
                name="booking_has_exactly_one_product",
            )
        ]

    def __str__(self):
        return f"Booking #{self.pk} — {self.customer.email}"

    @property
    def subtotal(self):
        """The booking's price: its quote line items when an admin has built a quote,
        otherwise the trip total recorded at checkout. Checkout bookings never get line
        items, so summing those alone showed every self-serve booking as $0."""
        line_items = self.line_items.all()
        if line_items:
            return sum(item.quote_price for item in line_items)
        invoice = getattr(self, "invoice", None)
        return (invoice.trip_total or 0) if invoice else 0

    @property
    def package_title(self):
        return self.safari.title if self.safari_id else self.region_safari.title

    @property
    def region_name(self):
        return self.safari.destination if self.safari_id else self.region_safari.region.name


class InvoiceQuerySet(models.QuerySet):
    def with_effective_status(self):
        """Annotate `effective_status_db`, the SQL equivalent of the
        `effective_status` property below — must be kept in sync with it.

        Filtering or aggregating on the Python property used to mean loading
        every invoice into memory to evaluate it row by row (InvoiceViewSet's
        ?status= filter, FinanceSummaryView's totals). This makes the same
        result available to .filter()/.aggregate() as ordinary SQL.
        """
        from django.db.models import Case, CharField, F, Value, When
        from django.utils import timezone

        return self.annotate(
            effective_status_db=Case(
                When(status=self.model.STATUS_PAID, then=Value(self.model.STATUS_PAID)),
                When(due_date__lt=timezone.localdate(), then=Value("overdue")),
                default=F("status"),
                output_field=CharField(),
            )
        )


class Invoice(models.Model):
    """Issued automatically when a quote is sent (2.2 send_quote); a snapshot of the booking's
    subtotal at that moment. Payment status is set manually by Admin — there's no payment
    gateway (5.1 / 5.2), and "overdue" is computed from due_date rather than stored."""

    STATUS_UNPAID = "unpaid"
    STATUS_DEPOSIT_PAID = "deposit_paid"
    STATUS_PAID = "paid"

    STATUS_CHOICES = [
        (STATUS_UNPAID, "Unpaid"),
        (STATUS_DEPOSIT_PAID, "Deposit Paid"),
        (STATUS_PAID, "Paid"),
    ]

    booking = models.OneToOneField(Booking, related_name="invoice", on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    # Full trip price, captured at deposit-payment time from the checkout page's own price
    # computation (the same trust boundary `amount` already crosses — there's still no
    # server-side price recompute). Null for invoices issued the older way (2.2 send_quote),
    # which have no "remaining balance" concept to offer.
    trip_total = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNPAID)
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    objects = InvoiceQuerySet.as_manager()

    class Meta:
        ordering = ["-issued_date"]

    def __str__(self):
        return f"Invoice for booking #{self.booking_id}"

    @property
    def is_overdue(self):
        from django.utils import timezone

        return self.status != self.STATUS_PAID and self.due_date < timezone.localdate()

    @property
    def effective_status(self):
        return "overdue" if self.is_overdue else self.status

    @property
    def remaining_balance(self):
        if self.trip_total is None:
            return None
        return max(self.trip_total - self.amount, 0)


class QuoteLineItem(models.Model):
    booking = models.ForeignKey(Booking, related_name="line_items", on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.PositiveIntegerField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    @property
    def quote_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.label} (${self.quote_price})"


class Review(models.Model):
    """A tourist's post-trip review (4.3), the only source for a Guide's aggregate rating (3.4)."""

    booking = models.OneToOneField(Booking, related_name="review", on_delete=models.CASCADE)
    guide = models.ForeignKey(
        "guides.Guide", related_name="reviews", null=True, blank=True, on_delete=models.SET_NULL
    )
    guide_rating = models.PositiveSmallIntegerField()
    trip_rating = models.PositiveSmallIntegerField()
    testimonial = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review for booking #{self.booking_id}"


class BookingNote(models.Model):
    booking = models.ForeignKey(Booking, related_name="notes", on_delete=models.CASCADE)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="booking_notes", null=True, on_delete=models.SET_NULL
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Note on booking #{self.booking_id}"


class TripMilestone(models.Model):
    """One day-by-day itinerary stop, snapshotted from the booked safari/region_safari's
    itinerary at booking-creation time. The assigned Guide marks these complete in order
    (3.2); the Tourist's Trip Progress page (4.2) reads the same list."""

    STATUS_UPCOMING = "upcoming"
    STATUS_CURRENT = "current"
    STATUS_COMPLETED = "completed"

    STATUS_CHOICES = [
        (STATUS_UPCOMING, "Upcoming"),
        (STATUS_CURRENT, "Current"),
        (STATUS_COMPLETED, "Completed"),
    ]

    booking = models.ForeignKey(Booking, related_name="milestones", on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    day = models.PositiveIntegerField()
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPCOMING)
    note = models.TextField(blank=True)
    photo = models.URLField(max_length=500, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Booking #{self.booking_id} day {self.day}: {self.title}"
