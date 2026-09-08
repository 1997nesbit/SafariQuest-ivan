from django.contrib import admin

from .models import Destination, DestinationExperience, Park


class DestinationExperienceInline(admin.TabularInline):
    model = DestinationExperience
    extra = 1


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "badge"]
    inlines = [DestinationExperienceInline]


@admin.register(Park)
class ParkAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "region", "badge"]
    list_filter = ["region"]
