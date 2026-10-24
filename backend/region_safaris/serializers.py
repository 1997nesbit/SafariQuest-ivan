from django.db import transaction
from rest_framework import serializers

from destinations.models import Destination, Park

from .models import RegionSafari, RegionSafariItineraryDay


class RegionSafariItineraryDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionSafariItineraryDay
        fields = ["day", "title", "description"]


class RegionSafariSerializer(serializers.ModelSerializer):
    itinerary = RegionSafariItineraryDaySerializer(many=True)
    region = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all())
    parks = serializers.PrimaryKeyRelatedField(queryset=Park.objects.all(), many=True, required=False)

    class Meta:
        model = RegionSafari
        fields = [
            "slug", "title", "image", "image_alt", "gallery_images", "rating", "days",
            "accommodation", "price", "price_usd", "badge", "signature", "region", "parks",
            "overview", "highlights", "included", "excluded", "itinerary",
        ]

    def validate(self, attrs):
        region = attrs.get("region", getattr(self.instance, "region", None))
        parks = attrs.get("parks")
        if parks is not None and region is not None:
            mismatched = [park.slug for park in parks if park.region_id != region.slug]
            if mismatched:
                raise serializers.ValidationError(
                    {"parks": f"Parks {mismatched} do not belong to region '{region.slug}'."}
                )
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            itinerary_data = validated_data.pop("itinerary")
            parks_data = validated_data.pop("parks", [])
            safari = RegionSafari.objects.create(**validated_data)
            safari.parks.set(parks_data)
            for day in itinerary_data:
                RegionSafariItineraryDay.objects.create(safari=safari, **day)
        return safari

    def update(self, instance, validated_data):
        with transaction.atomic():
            itinerary_data = validated_data.pop("itinerary", None)
            parks_data = validated_data.pop("parks", None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if parks_data is not None:
                instance.parks.set(parks_data)
            if itinerary_data is not None:
                instance.itinerary.all().delete()
                for day in itinerary_data:
                    RegionSafariItineraryDay.objects.create(safari=instance, **day)
        return instance
