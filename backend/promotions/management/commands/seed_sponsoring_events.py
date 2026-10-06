from django.core.management.base import BaseCommand
from django.db import transaction

from destinations.models import Destination
from promotions.models import Promotion

# The event from the client's brief. Images reuse an existing site photo until the
# client supplies real artwork, and the phone number is the company's WhatsApp
# number, which still needs confirming before go-live.
PLACEHOLDER_PHONE = "+255 725 377 625"

EVENTS = [
    {
        "title": "Kili Marathon 2027",
        "description": "Pande will be sponsoring. Call this number to get your ticket at a 20% discount.",
        "order": 0,
    },
]


class Command(BaseCommand):
    help = "Seed the homepage Sponsoring Events. Idempotent: an event that already exists (matched by title) is left unchanged."

    @transaction.atomic
    def handle(self, *args, **options):
        image = Destination.objects.exclude(images=[]).values_list("images", flat=True).first()
        if not image:
            self.stderr.write("No destination image found to use as a placeholder.")
            return
        photo = image[0]

        for entry in EVENTS:
            if Promotion.objects.filter(title=entry["title"]).exists():
                self.stdout.write(f"Skipped {entry['title']} (already exists)")
                continue
            Promotion.objects.create(image=photo, phone=PLACEHOLDER_PHONE, **entry)
            self.stdout.write(self.style.SUCCESS(f"Created {entry['title']}"))
