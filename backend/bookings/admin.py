from django.contrib import admin

from .models import Booking, BookingNote, QuoteLineItem


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
