from django.contrib import admin

from .models import ItineraryDay, SafariPackage


class ItineraryDayInline(admin.TabularInline):
    model = ItineraryDay
    extra = 1


@admin.register(SafariPackage)
class SafariPackageAdmin(admin.ModelAdmin):
    list_display = ["slug", "title", "destination", "price", "signature"]
    inlines = [ItineraryDayInline]
