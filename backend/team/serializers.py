from urllib.parse import urlparse

from rest_framework import serializers

from .models import BIO_MAX_LENGTH, TRANSLATABLE_FIELD_LIMITS, TRANSLATION_LOCALES, TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ["id", "name", "title", "bio", "photo", "photo_alt", "translations", "order", "is_published"]
        # bio is a TextField, which has no cap of its own; without this a single
        # request could store megabytes of text that the About card then has to render.
        extra_kwargs = {"bio": {"max_length": BIO_MAX_LENGTH}}

    def validate_photo(self, value):
        # Django's URL validation also accepts ftp:// and ftps://, which a browser
        # won't load in an <img>.
        if value and urlparse(value).scheme not in ("http", "https"):
            raise serializers.ValidationError("Photo URL must start with http:// or https://.")
        return value

    def validate_translations(self, value):
        """Check the shape and return it with empty entries dropped.

        Empty strings, and languages left with nothing in them, are removed so
        "no translation" is always represented the same way — by absence — and
        the frontend's fall-back-to-English check never has to distinguish a
        missing key from a blank one.
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Translations must be an object keyed by language code.")

        cleaned = {}
        for locale, fields in value.items():
            if locale not in TRANSLATION_LOCALES:
                raise serializers.ValidationError(
                    f"Unsupported language '{locale}'. Supported: {', '.join(TRANSLATION_LOCALES)}."
                )
            if not isinstance(fields, dict):
                raise serializers.ValidationError(f"Translation for '{locale}' must be an object.")
            unknown = set(fields) - set(TRANSLATABLE_FIELD_LIMITS)
            if unknown:
                raise serializers.ValidationError(
                    f"Unknown field(s) {sorted(unknown)} in '{locale}' translation. "
                    f"Translatable: {', '.join(TRANSLATABLE_FIELD_LIMITS)}."
                )
            kept = {}
            for field, text in fields.items():
                if not isinstance(text, str):
                    raise serializers.ValidationError(f"'{locale}.{field}' must be text.")
                text = text.strip()
                limit = TRANSLATABLE_FIELD_LIMITS[field]
                if len(text) > limit:
                    raise serializers.ValidationError(
                        f"'{locale}.{field}' is too long ({len(text)} characters; the limit is {limit})."
                    )
                if text:
                    kept[field] = text
            if kept:
                cleaned[locale] = kept
        return cleaned
