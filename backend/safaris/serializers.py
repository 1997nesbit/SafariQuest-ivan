from django.db import transaction
from rest_framework import serializers

from .models import ItineraryDay, SafariPackage


class ItineraryDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryDay
        fields = ["day", "title", "description"]


class SafariPackageSerializer(serializers.ModelSerializer):
    itinerary = ItineraryDaySerializer(many=True)

    class Meta:
        model = SafariPackage
        fields = [
            "slug", "title", "image", "image_alt", "rating", "days",
            "accommodation", "price", "badge", "signature", "destination",
            "overview", "highlights", "included", "excluded", "itinerary",
        ]

    def create(self, validated_data):
        with transaction.atomic():
            itinerary_data = validated_data.pop("itinerary")
            safari = SafariPackage.objects.create(**validated_data)
            for day in itinerary_data:
                ItineraryDay.objects.create(safari=safari, **day)
        return safari

    def update(self, instance, validated_data):
        with transaction.atomic():
            itinerary_data = validated_data.pop("itinerary", None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if itinerary_data is not None:
                instance.itinerary.all().delete()
                for day in itinerary_data:
                    ItineraryDay.objects.create(safari=instance, **day)
        return instance
