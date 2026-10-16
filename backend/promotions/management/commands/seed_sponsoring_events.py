from django.core.management.base import BaseCommand
from django.db import transaction

from promotions.models import Promotion

# The company's WhatsApp number, as confirmed by the client on 2026-10-12.
PANDE_PHONE = "+255 725 677 365"

# Real annual events in Tanzania. Timings are each event's usual slot; confirm the
# exact 2027 dates with the organisers before advertising them. Photos are from
# Wikimedia Commons (credit shown after each URL) and need attribution if kept.
EVENTS = [
    {
        "title": "Kilimanjaro Marathon 2027",
        "description": (
            "Moshi, every late February or early March: full marathon, half marathon and 5 km fun run, "
            "starting and finishing at Moshi Co-operative University below Mount Kilimanjaro. "
            "Pande is sponsoring. Call this number to get your ticket at a 20% discount."
        ),
        # "Kili Marathon.jpg", Lusubilo FM, CC BY-SA 4.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/0/04/Kili_Marathon.jpg",
        "order": 0,
    },
    {
        "title": "Sauti za Busara 2027",
        "description": (
            "Zanzibar's festival of live African music, held every February in the Old Fort, Stone Town. "
            "Message us on WhatsApp to pair the festival with a safari and beach stay."
        ),
        # "Sceneric view of the amphitheater at the old fort.jpg", CC BY-SA 4.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Sceneric_view_of_the_amphitheater_at_the_old_fort.jpg/1280px-Sceneric_view_of_the_amphitheater_at_the_old_fort.jpg",
        "order": 1,
    },
    {
        "title": "Karibu-KiliFair 2027",
        "description": (
            "East Africa's largest tourism trade fair, held in Arusha each June, where lodges, parks and "
            "safari operators from across the region meet. Message us on WhatsApp to plan your visit."
        ),
        # "Look at Mt. Meru Arusha Tanzania.jpg", CC BY-SA 3.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Look_at_Mt._Meru_Arusha_Tanzania.jpg/1280px-Look_at_Mt._Meru_Arusha_Tanzania.jpg",
        "order": 2,
    },
    {
        "title": "Zanzibar International Film Festival 2027",
        "description": (
            "One of East Africa's largest film, music and arts festivals, held at the Old Fort in Stone Town, "
            "usually in late June or July. Message us on WhatsApp for festival travel and stays."
        ),
        # "Zanzibar International Film Festival 2013.jpg", CC BY 2.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Zanzibar_International_Film_Festival_2013.jpg/1280px-Zanzibar_International_Film_Festival_2013.jpg",
        "order": 3,
    },
]


# Dummy events for demonstrations only (`--demo`). They are shown on the homepage
# straight away, so they are clearly labelled DEMO, and the number is a fake that
# will not reach anyone. Delete them in the admin once the demo is over.
DEMO_PHONE = "+255 000 000 000"
DEMO_IMAGE = EVENTS[0]["image"]
DEMO_EVENTS = [
    {"title": f"DEMO Event {n}", "description": "Dummy event for a demonstration. Not a real booking offer.", "order": n - 1}
    for n in range(1, 7)
]


class Command(BaseCommand):
    help = "Seed the homepage Sponsoring Events. Idempotent: an event that already exists (matched by title) is left unchanged."

    def add_arguments(self, parser):
        parser.add_argument(
            "--demo",
            action="store_true",
            help="Create six DEMO events with a fake phone number instead of the real events.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete every existing event first, including ones added in the admin.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["replace"]:
            deleted, _ = Promotion.objects.all().delete()
            self.stdout.write(f"Deleted {deleted} existing event(s)")

        if options["demo"]:
            events = [{**entry, "image": DEMO_IMAGE, "phone": DEMO_PHONE} for entry in DEMO_EVENTS]
        else:
            events = [{**entry, "phone": PANDE_PHONE} for entry in EVENTS]

        for entry in events:
            if Promotion.objects.filter(title=entry["title"]).exists():
                self.stdout.write(f"Skipped {entry['title']} (already exists)")
                continue
            Promotion.objects.create(**entry)
            self.stdout.write(self.style.SUCCESS(f"Created {entry['title']}"))
