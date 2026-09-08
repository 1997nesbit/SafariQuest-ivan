from django.db import models


class SafariPackage(models.Model):
    DESTINATION_CHOICES = [
        ("Serengeti National Park", "Serengeti National Park"),
        ("Ngorongoro Conservation Area", "Ngorongoro Conservation Area"),
        ("Tarangire & Manyara", "Tarangire & Manyara"),
        ("Zanzibar Extensions", "Zanzibar Extensions"),
    ]

    slug = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=150)
    image = models.URLField(max_length=500)
    image_alt = models.CharField(max_length=255)
    gallery_images = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    days = models.PositiveIntegerField()
    accommodation = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    badge = models.CharField(max_length=64, blank=True)
    signature = models.BooleanField(default=False)
    destination = models.CharField(max_length=40, choices=DESTINATION_CHOICES)
    parks = models.ManyToManyField("destinations.Park", related_name="safaris", blank=True)
    overview = models.TextField()
    highlights = models.JSONField(default=list)
    included = models.JSONField(default=list)
    excluded = models.JSONField(default=list)

    def __str__(self):
        return self.title


class ItineraryDay(models.Model):
    safari = models.ForeignKey(SafariPackage, related_name="itinerary", on_delete=models.CASCADE)
    day = models.PositiveIntegerField()
    title = models.CharField(max_length=150)
    description = models.TextField()

    class Meta:
        ordering = ["day"]

    def __str__(self):
        return f"{self.safari_id} day {self.day}: {self.title}"
