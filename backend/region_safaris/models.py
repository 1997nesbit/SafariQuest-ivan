from django.db import models


class RegionSafari(models.Model):
    """A bookable safari scoped to a single region, e.g. a Morogoro mini-safari."""

    slug = models.CharField(max_length=64, primary_key=True)
    region = models.ForeignKey("destinations.Destination", related_name="region_safaris", on_delete=models.CASCADE)
    title = models.CharField(max_length=150)
    image = models.URLField(max_length=500)
    image_alt = models.CharField(max_length=255)
    gallery_images = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1)
    days = models.PositiveIntegerField()
    accommodation = models.CharField(max_length=120)
    # Per adult, in TZS (paid by mobile money through Snippe).
    price = models.PositiveIntegerField()
    # Per adult, in USD (paid by card through Senjaropay). Optional: a product without
    # one can only be booked in TZS.
    price_usd = models.PositiveIntegerField(null=True, blank=True)
    badge = models.CharField(max_length=64, blank=True)
    signature = models.BooleanField(default=False)
    parks = models.ManyToManyField("destinations.Park", related_name="region_safaris", blank=True)
    overview = models.TextField()
    highlights = models.JSONField(default=list)
    included = models.JSONField(default=list)
    excluded = models.JSONField(default=list)

    def __str__(self):
        return self.title


class RegionSafariItineraryDay(models.Model):
    safari = models.ForeignKey(RegionSafari, related_name="itinerary", on_delete=models.CASCADE)
    day = models.PositiveIntegerField()
    title = models.CharField(max_length=150)
    description = models.TextField()

    class Meta:
        ordering = ["day"]

    def __str__(self):
        return f"{self.safari_id} day {self.day}: {self.title}"
