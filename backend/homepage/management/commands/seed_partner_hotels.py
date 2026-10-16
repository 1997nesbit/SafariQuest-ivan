from django.core.management.base import BaseCommand
from django.db import transaction

from homepage.models import PartnerHotel

# Real properties on Pande's usual routes, each linking to its official website.
# Photos are of the property itself, from Wikimedia Commons (credit shown after
# each URL), and need attribution if kept. Swap in the hotels Pande actually
# contracts with in the admin.
HOTELS = [
    {
        "name": "The Palace Hotel Arusha",
        "location": "Arusha",
        "website": "https://palacehotelarusha.com/",
        # "Palace Hotel Arusha.jpg", Edward ambele, CC BY-SA 4.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Palace_Hotel_Arusha.jpg",
    },
    {
        "name": "Elewana Tarangire Treetops",
        "location": "Tarangire, Manyara Region",
        "website": "https://www.elewanacollection.com/tarangire-treetops/at-a-glance",
        # "Tarangire Treetops Lodge (28715784605).jpg", Richard Mortel, CC BY 2.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Tarangire_Treetops_Lodge_%2828715784605%29.jpg/1280px-Tarangire_Treetops_Lodge_%2828715784605%29.jpg",
    },
    {
        "name": "Neptune Ngorongoro Luxury Lodge",
        "location": "Karatu, Ngorongoro Highlands",
        "website": "https://www.neptunehotels.com/neptune-ngorongoro/",
        # "Neptune Ngorongoro Crater Luxury Lodge (2) (28621605916).jpg", Richard Mortel, CC BY 2.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Neptune_Ngorongoro_Crater_Luxury_Lodge_%282%29_%2828621605916%29.jpg/1280px-Neptune_Ngorongoro_Crater_Luxury_Lodge_%282%29_%2828621605916%29.jpg",
    },
    {
        "name": "Ngorongoro Serena Safari Lodge",
        "location": "Ngorongoro Crater rim",
        "website": "https://www.serenahotels.com/ngorongoro",
        # "Ngorongoro Serena Lodge - panoramio.jpg", Alex Petrenko, CC BY-SA 3.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Ngorongoro_Serena_Lodge_-_panoramio.jpg",
    },
    {
        "name": "Zanzibar Serena Hotel",
        "location": "Stone Town, Zanzibar",
        "website": "https://www.serenahotels.com/zanzibar",
        # "Zanzibar 2012 06 06 4240 (7592218390).jpg", Harvey Barrison, CC BY-SA 2.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Zanzibar_2012_06_06_4240_%287592218390%29.jpg/1280px-Zanzibar_2012_06_06_4240_%287592218390%29.jpg",
    },
    {
        "name": "Tembo Hotel",
        "location": "Stone Town, Zanzibar",
        "website": "https://tembohotel.com/",
        # "Tembo hotel since 1995.jpg", Lucy Mbungo, CC BY-SA 4.0
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Tembo_hotel_since_1995.jpg/1280px-Tembo_hotel_since_1995.jpg",
    },
]


class Command(BaseCommand):
    help = "Seed the homepage Partner Hotels. Idempotent: a hotel that already exists (matched by name) is left unchanged."

    def add_arguments(self, parser):
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete every existing partner hotel first, including ones added in the admin.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["replace"]:
            deleted, _ = PartnerHotel.objects.all().delete()
            self.stdout.write(f"Deleted {deleted} existing hotel(s)")

        for order, entry in enumerate(HOTELS):
            if PartnerHotel.objects.filter(name=entry["name"]).exists():
                self.stdout.write(f"Skipped {entry['name']} (already exists)")
                continue
            PartnerHotel.objects.create(order=order, **entry)
            self.stdout.write(self.style.SUCCESS(f"Created {entry['name']}"))
