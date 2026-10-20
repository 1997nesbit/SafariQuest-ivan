from django.contrib import admin

from .models import Booking, BookingNote, Payment, PaymentAttempt, PaymentOutage, QuoteLineItem, SnippeNotice


class QuoteLineItemInline(admin.TabularInline):
    model = QuoteLineItem
    extra = 1


class BookingNoteInline(admin.TabularInline):
    model = BookingNote
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "safari", "stage", "start_date", "end_date", "assigned_guide"]
    list_filter = ["stage"]
    inlines = [QuoteLineItemInline, BookingNoteInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Read-mostly: payments are written by the Snippe integration (bookings.payments)."""

    list_display = ["id", "booking", "kind", "status", "amount", "currency", "created_at", "completed_at"]
    list_filter = ["kind", "status"]
    search_fields = ["session_reference", "provider_reference", "booking__customer__email"]
    readonly_fields = [
        "booking", "kind", "amount", "currency", "trip_total", "referral_code", "discount_percent",
        "commission_percent", "session_reference", "checkout_url", "provider_reference", "created_at",
        "completed_at",
    ]


@admin.register(PaymentOutage)
class PaymentOutageAdmin(admin.ModelAdmin):
    """Outages read from Snippe's emails and status page land here; add one by hand for
    anything Snippe announces some other way. Untick Is active to cancel one."""

    list_display = ["channel", "blocks_payments", "starts_at", "ends_at", "is_active", "source", "subject"]
    list_filter = ["is_active", "channel", "source", "blocks_payments"]
    readonly_fields = ["source", "source_ref", "created_at"]


@admin.register(SnippeNotice)
class SnippeNoticeAdmin(admin.ModelAdmin):
    list_display = ["subject", "sender", "received_at", "outcome"]
    readonly_fields = ["message_id", "subject", "sender", "received_at", "outcome", "created_at"]
    search_fields = ["subject", "outcome"]


@admin.register(PaymentAttempt)
class PaymentAttemptAdmin(admin.ModelAdmin):
    """What Snippe's webhooks reported per network — the evidence behind a detected outage."""

    list_display = ["created_at", "channel", "succeeded", "counts_toward_outage", "failure_reason", "payment"]
    list_filter = ["channel", "succeeded", "counts_toward_outage"]
    readonly_fields = [
        "event_id", "payment", "channel", "succeeded", "counts_toward_outage", "failure_reason", "created_at",
    ]
