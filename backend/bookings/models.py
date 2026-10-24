from django.conf import settings
from django.db import models

from . import currency as currency_module


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
    # What the whole booking is priced, invoiced and paid in (bookings.currency) — chosen
    # at checkout. Quote line items, the invoice and every payment use it too.
    currency = models.CharField(max_length=3, choices=currency_module.CHOICES, default=currency_module.TZS)
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
        items, so summing those alone showed every self-serve booking as 0."""
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
    subtotal at that moment — or when a checkout deposit is paid through Snippe (Payment).
    Snippe payments update status automatically; Admin can still set it by hand, and
    "overdue" is computed from due_date rather than stored."""

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


class Payment(models.Model):
    """One Snippe checkout session for a booking's deposit or remaining balance.

    Created pending when the tourist clicks pay; bookings.payments.complete_payment turns
    it into an invoice/stage change once Snippe confirms the money arrived. Everything
    that decision needs — the amount and, for a deposit, the trip total and referral
    terms the tourist was shown — is captured here at session time, so a later change
    to prices or referral settings can't alter what an already-paid session records."""

    KIND_DEPOSIT = "deposit"
    KIND_BALANCE = "balance"
    KIND_CHOICES = [(KIND_DEPOSIT, "Deposit"), (KIND_BALANCE, "Balance")]

    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_EXPIRED = "expired"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_EXPIRED, "Expired"),
    ]

    # "direct": a prompt sent straight to `phone_number`, paid without leaving the site.
    # "hosted": a session on Snippe's checkout page (`checkout_url`).
    MODE_DIRECT = "direct"
    MODE_HOSTED = "hosted"
    MODE_CHOICES = [(MODE_DIRECT, "Direct (phone prompt)"), (MODE_HOSTED, "Hosted checkout page")]

    booking = models.ForeignKey(Booking, related_name="payments", on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default=MODE_HOSTED)
    # Direct payments only, as 255XXXXXXXXX.
    phone_number = models.CharField(max_length=15, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    amount = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, choices=currency_module.CHOICES, default=currency_module.TZS)
    # Who takes the money: Snippe for TZS, Senjaropay for USD (bookings.currency.PROVIDER_FOR).
    provider = models.CharField(max_length=12, default=currency_module.PROVIDER_SNIPPE)
    # Deposit only: the full trip price the deposit was computed from.
    trip_total = models.PositiveIntegerField(null=True, blank=True)
    referral_code = models.ForeignKey(
        "referrals.ReferralCode", related_name="payments", null=True, blank=True, on_delete=models.SET_NULL
    )
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    # Snippe's reference for this payment: the session's (hosted) or the payment's (direct).
    session_reference = models.CharField(max_length=100, unique=True, null=True, blank=True)
    checkout_url = models.URLField(max_length=500, blank=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    # Set when Snippe took the money but it couldn't be applied (e.g. a second deposit
    # session paid after the first already was) — needs a refund or manual handling.
    needs_attention = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_kind_display()} payment for booking #{self.booking_id} ({self.status})"


class PaymentOutageQuerySet(models.QuerySet):
    def current(self, now=None):
        from django.utils import timezone

        now = now or timezone.now()
        return self.filter(is_active=True, starts_at__lte=now).filter(
            models.Q(ends_at__isnull=True) | models.Q(ends_at__gt=now)
        )


class PaymentOutage(models.Model):
    """A window when Snippe can't take some or all payments, so the site warns or refuses
    before sending a tourist to a checkout that will fail (bookings.outages).

    Written by `manage.py check_snippe_outages` from Snippe's notice emails and status page,
    or by hand in admin. One row per channel. A single network being down only warns — the
    tourist picks the network on Snippe's page and can use another — while `blocks_payments`
    (every channel, or Snippe itself) stops new payments outright."""

    CHANNEL_ALL = "all"
    CHANNEL_MPESA = "mpesa"
    CHANNEL_AIRTEL = "airtel"
    CHANNEL_MIXX = "mixx"
    CHANNEL_HALOTEL = "halotel"
    CHANNEL_CHOICES = [
        (CHANNEL_ALL, "All payments"),
        (CHANNEL_MPESA, "M-Pesa"),
        (CHANNEL_AIRTEL, "Airtel Money"),
        (CHANNEL_MIXX, "Mixx by Yas"),
        (CHANNEL_HALOTEL, "Halotel"),
    ]

    SOURCE_EMAIL = "email"
    SOURCE_STATUS_PAGE = "status_page"
    SOURCE_MANUAL = "manual"
    SOURCE_DETECTED = "detected"
    SOURCE_CHOICES = [
        (SOURCE_EMAIL, "Snippe email"),
        (SOURCE_STATUS_PAGE, "Snippe status page"),
        (SOURCE_DETECTED, "Detected from failed payments"),
        (SOURCE_MANUAL, "Added by admin"),
    ]

    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    blocks_payments = models.BooleanField(default=False)
    starts_at = models.DateTimeField()
    # Null: until someone (or the next status check) ends it.
    ends_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=15, choices=SOURCE_CHOICES, default=SOURCE_MANUAL)
    # The email's Message-ID, or the status page component — what makes re-reading the
    # same notice a no-op.
    source_ref = models.CharField(max_length=300, blank=True)
    subject = models.CharField(max_length=300, blank=True)
    # Off for a notice the parser couldn't fully read; admin checks it and switches it on.
    is_active = models.BooleanField(default=True)
    review_note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = PaymentOutageQuerySet.as_manager()

    class Meta:
        ordering = ["-starts_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["source_ref", "channel"],
                condition=~models.Q(source_ref=""),
                name="payment_outage_unique_source_channel",
            )
        ]

    def __str__(self):
        return f"{self.get_channel_display()} outage from {self.starts_at:%Y-%m-%d %H:%M}"


class PaymentAttempt(models.Model):
    """One mobile-money attempt Snippe reported back by webhook — which network, and whether
    it went through. bookings.outages.record_attempt watches these for a network failing
    repeatedly when Snippe hasn't announced anything."""

    # Snippe's event id: it retries webhooks, and a retried event mustn't count twice.
    event_id = models.CharField(max_length=100, blank=True)
    payment = models.ForeignKey(Payment, related_name="attempts", null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.CharField(max_length=10, choices=PaymentOutage.CHANNEL_CHOICES)
    succeeded = models.BooleanField()
    # False for failures the tourist caused (declined the prompt, wrong PIN, no funds),
    # which say nothing about the network.
    counts_toward_outage = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["channel", "created_at"])]
        constraints = [
            models.UniqueConstraint(
                fields=["event_id"], condition=~models.Q(event_id=""), name="payment_attempt_unique_event"
            )
        ]

    def __str__(self):
        return f"{self.get_channel_display()} {'success' if self.succeeded else 'failure'} at {self.created_at:%Y-%m-%d %H:%M}"


class SnippeNotice(models.Model):
    """Every Snippe email `check_snippe_outages` has read, and what it did about it — so a
    notice is acted on once, and there's a record of why payments were stopped."""

    message_id = models.CharField(max_length=300, unique=True)
    subject = models.CharField(max_length=300, blank=True)
    sender = models.CharField(max_length=300, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    outcome = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} — {self.outcome}"


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
        return f"{self.label} ({currency_module.format_amount(self.quote_price, self.booking.currency)})"


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
