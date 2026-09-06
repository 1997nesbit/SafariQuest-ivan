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
        "safaris.SafariPackage", related_name="bookings", on_delete=models.PROTECT
    )
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default=STAGE_NEW_INQUIRY)
    start_date = models.DateField()
    end_date = models.DateField()
    guests = models.PositiveIntegerField()
    assigned_guide = models.ForeignKey(
        "guides.Guide", related_name="bookings", null=True, blank=True, on_delete=models.SET_NULL
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking #{self.pk} — {self.customer.email}"

    @property
    def subtotal(self):
        return sum(item.quote_price for item in self.line_items.all())


class QuoteLineItem(models.Model):
    booking = models.ForeignKey(Booking, related_name="line_items", on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    cost = models.PositiveIntegerField()
    markup_percent = models.PositiveIntegerField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    @property
    def quote_price(self):
        return round(self.cost * (1 + self.markup_percent / 100))

    def __str__(self):
        return f"{self.label} (${self.quote_price})"


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
