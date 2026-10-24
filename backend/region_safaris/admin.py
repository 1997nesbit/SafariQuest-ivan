from django.contrib import admin

from .models import RegionSafari, RegionSafariItineraryDay


class RegionSafariItineraryDayInline(admin.TabularInline):
    model = RegionSafariItineraryDay
    extra = 1


@admin.register(RegionSafari)
class RegionSafariAdmin(admin.ModelAdmin):
    list_display = ["slug", "title", "region", "price", "price_usd", "signature"]
    list_filter = ["region"]
    inlines = [RegionSafariItineraryDayInline]
