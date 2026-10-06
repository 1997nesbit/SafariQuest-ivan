import re
from urllib.parse import urlparse

from rest_framework import serializers

from .models import Promotion

# Digits with optional separators and a leading +. Enough to catch a stray word or
# a URL typed into the phone field, without guessing every national format.
PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9 ()\-]*$")


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ["id", "title", "image", "description", "phone", "order", "is_published"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a title for the event.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter a short description.")
        return value

    def validate_image(self, value):
        # Django's URL validation also accepts ftp://, which a browser won't load in <img>.
        if urlparse(value).scheme not in ("http", "https"):
            raise serializers.ValidationError("The image must be a web address starting with http:// or https://.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        digits = re.sub(r"\D", "", value)
        if not PHONE_PATTERN.match(value) or not 7 <= len(digits) <= 15:
            raise serializers.ValidationError("Enter a phone number, e.g. +255 725 377 625.")
        return value
