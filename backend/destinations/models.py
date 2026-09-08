from django.db import models


class Destination(models.Model):
    slug = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=120)
    images = models.JSONField(default=list)
    image_alt = models.CharField(max_length=255)
    badge = models.CharField(max_length=64)
    tags = models.JSONField(default=list)
    best_time_to_visit = models.CharField(max_length=120)
    highlight = models.CharField(max_length=255)
    link_label = models.CharField(max_length=64)
    about = models.TextField()
    wildlife = models.TextField()
    getting_there = models.TextField()

    def __str__(self):
        return self.name


class DestinationExperience(models.Model):
    destination = models.ForeignKey(Destination, related_name="experiences", on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.destination_id}: {self.name}"


class Park(models.Model):
    """A specific park or wonder a tourist visits, scoped to one region (Destination)."""

    slug = models.CharField(max_length=64, primary_key=True)
    region = models.ForeignKey(Destination, related_name="parks", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    images = models.JSONField(default=list, blank=True)
    image_alt = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=64, blank=True)
    tags = models.JSONField(default=list, blank=True)
    best_time_to_visit = models.CharField(max_length=120, blank=True)
    highlight = models.CharField(max_length=255, blank=True)
    about = models.TextField(blank=True)
    wildlife = models.TextField(blank=True)
    getting_there = models.TextField(blank=True)

    def __str__(self):
        return self.name
