from django.contrib import admin

from .models import Destination, DestinationExperience


class DestinationExperienceInline(admin.TabularInline):
    model = DestinationExperience
    extra = 1


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "badge"]
    inlines = [DestinationExperienceInline]
