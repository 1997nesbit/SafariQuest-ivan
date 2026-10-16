from django.contrib import admin

from .models import HomepageImage, PartnerHotel


@admin.register(HomepageImage)
class HomepageImageAdmin(admin.ModelAdmin):
    list_display = ["slot", "alt", "updated_at"]
    readonly_fields = ["slot", "updated_at"]


@admin.register(PartnerHotel)
class PartnerHotelAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "website", "order", "is_published"]
    list_editable = ["order", "is_published"]
    search_fields = ["name", "location"]
