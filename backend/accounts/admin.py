from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["email"]
    list_display = ["email", "name", "role", "is_staff", "is_active"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "name", "role", "password1", "password2")}),
    )
    search_fields = ["email", "name"]
    list_filter = ["role", "is_staff", "is_active"]
