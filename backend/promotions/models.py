from django.db import models

IMAGE_URL_MAX_LENGTH = 500
TITLE_MAX_LENGTH = 120
DESCRIPTION_MAX_LENGTH = 500
PHONE_MAX_LENGTH = 30


class PromotionQuerySet(models.QuerySet):
    def live(self):
        """Published — the only state visitors see. Admins switch an event on or off."""
        return self.filter(is_published=True)


class Promotion(models.Model):
    """A sponsored event shown in the homepage's "Sponsoring Events" carousel.

    Deliberately minimal: an image, a title, a short description and a phone
    number. The phone number opens WhatsApp. There is no outbound link and no
    click tracking, because the partner handles its own bookings and commission.
    """

    title = models.CharField(max_length=TITLE_MAX_LENGTH)
    image = models.URLField(max_length=IMAGE_URL_MAX_LENGTH)
    description = models.CharField(max_length=DESCRIPTION_MAX_LENGTH)
    phone = models.CharField(max_length=PHONE_MAX_LENGTH)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = PromotionQuerySet.as_manager()

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title
