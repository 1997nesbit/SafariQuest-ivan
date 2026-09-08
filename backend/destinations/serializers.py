from django.db import transaction
from rest_framework import serializers

from .models import Destination, DestinationExperience, Park


class DestinationExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationExperience
        fields = ["name", "description"]


class DestinationSerializer(serializers.ModelSerializer):
    experiences = DestinationExperienceSerializer(many=True)

    class Meta:
        model = Destination
        fields = [
            "slug", "name", "images", "image_alt", "badge", "tags",
            "best_time_to_visit", "highlight", "link_label", "about",
            "wildlife", "getting_there", "experiences",
        ]

    def create(self, validated_data):
        with transaction.atomic():
            experiences_data = validated_data.pop("experiences")
            destination = Destination.objects.create(**validated_data)
            for order, experience in enumerate(experiences_data):
                DestinationExperience.objects.create(destination=destination, order=order, **experience)
        return destination

    def update(self, instance, validated_data):
        with transaction.atomic():
            experiences_data = validated_data.pop("experiences", None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if experiences_data is not None:
                instance.experiences.all().delete()
                for order, experience in enumerate(experiences_data):
                    DestinationExperience.objects.create(destination=instance, order=order, **experience)
        return instance


class ParkSerializer(serializers.ModelSerializer):
    region = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all())

    class Meta:
        model = Park
        fields = [
            "slug", "region", "name", "images", "image_alt", "badge", "tags",
            "best_time_to_visit", "highlight", "about", "wildlife", "getting_there",
        ]
