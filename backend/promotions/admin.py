from django.contrib import admin

from .models import Promotion


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ["title", "phone", "order", "is_published"]
    list_editable = ["order", "is_published"]
    readonly_fields = ["created_at"]
