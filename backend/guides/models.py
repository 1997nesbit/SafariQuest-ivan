from django.db import models


class Guide(models.Model):
    ROLE_CHOICES = [
        ("Senior Guide", "Senior Guide"),
        ("Expert Guide", "Expert Guide"),
        ("Driver-Guide", "Driver-Guide"),
        ("Camp Chef", "Camp Chef"),
        ("Tour Helper", "Tour Helper"),
    ]
    STATUS_CHOICES = [
        ("Available", "Available"),
        ("On Trip", "On Trip"),
        ("Off-Duty", "Off-Duty"),
    ]

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Available")
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)

    def __str__(self):
        return self.name
