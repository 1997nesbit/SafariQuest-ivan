from urllib.parse import urlparse

from rest_framework import serializers

from .models import HomepageImage, PartnerHotel


def _validate_image_scheme(value):
    # Django's URL validation also accepts ftp:// and ftps://, which a browser
    # won't load in an <img>.
    if value and urlparse(value).scheme not in ("http", "https"):
        raise serializers.ValidationError("Image URL must start with http:// or https://.")
    return value


class HomepageImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageImage
        fields = ["id", "slot", "image", "alt", "updated_at"]
        # The slot comes from the URL (see HomepageImageViewSet.update), never the body.
        read_only_fields = ["id", "slot", "updated_at"]

    def validate_image(self, value):
        return _validate_image_scheme(value)


class PartnerHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerHotel
        fields = ["id", "name", "location", "website", "image", "order", "is_published"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter the hotel's name.")
        return value

    def validate_website(self, value):
        # Shown as a link on the public homepage: only real web addresses, so
        # nothing like javascript: can end up in an href.
        if urlparse(value).scheme not in ("http", "https"):
            raise serializers.ValidationError("Website must start with http:// or https://.")
        return value

    def validate_image(self, value):
        return _validate_image_scheme(value)
