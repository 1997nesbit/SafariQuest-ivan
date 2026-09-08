from django.db import models


class Season(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)

    def __str__(self):
        return f"{self.name} ({self.multiplier}x)"
