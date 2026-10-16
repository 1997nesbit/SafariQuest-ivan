from django.core.management.base import BaseCommand
from django.db import transaction

from destinations.models import Destination, Park

PARKS = [
    {
        "slug": "serengeti-national-park",
        "region_slug": "arusha",
        "name": "Serengeti National Park",
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Serengeti_wildebeest_migration_JF2.jpg/1280px-Serengeti_wildebeest_migration_JF2.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/002_Male_Lion_prowling_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg/1280px-002_Male_Lion_prowling_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg",
        ],
        "image_alt": "Wildebeest on the Great Migration across the Serengeti plains.",
        "badge": "Great Migration",
        "tags": ["Endless Plains", "Big Cats"],
        "best_time_to_visit": "June – October",
        "highlight": "The Great Migration river crossings and the highest concentration of big cats in Africa.",
        "about": (
            "The Serengeti is Tanzania's most iconic national park — an endless expanse of golden plains that "
            "hosts the Great Migration, one of the natural world's most spectacular wildlife events."
        ),
        "wildlife": "Lions, cheetahs, leopards, and the annual migration of over a million wildebeest and zebra.",
        "getting_there": "Scheduled light aircraft flights from Arusha, or a scenic drive via Ngorongoro.",
    },
    {
        "slug": "ngorongoro-conservation-area",
        "region_slug": "arusha",
        "name": "Ngorongoro Conservation Area",
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Ngorongoro_Conservation_Area_2021-07_-_the_crater_from_the_rim.jpg/1280px-Ngorongoro_Conservation_Area_2021-07_-_the_crater_from_the_rim.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Lion_Ngorongoro_05.jpg/1280px-Lion_Ngorongoro_05.jpg",
        ],
        "image_alt": "The Ngorongoro Crater floor seen from the rim.",
        "badge": "UNESCO World Heritage",
        "tags": ["Volcanic Caldera", "Dense Wildlife"],
        "best_time_to_visit": "June – October",
        "highlight": "Unmatched wildlife density within a single volcanic caldera, including black rhino.",
        "about": (
            "A UNESCO World Heritage Site, the Ngorongoro Crater is the world's largest intact volcanic caldera "
            "— a natural amphitheater teeming with wildlife year-round."
        ),
        "wildlife": "Black rhino, lion prides, flamingo-lined soda lakes, and dense buffalo herds.",
        "getting_there": "A scenic drive along the crater rim from Arusha or the Serengeti.",
    },
    {
        "slug": "tarangire-manyara",
        "region_slug": "arusha",
        "name": "Tarangire & Manyara",
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Des_%C3%A9l%C3%A9phants_en_vedette_dans_le_parc_de_Tarangire.jpg/1280px-Des_%C3%A9l%C3%A9phants_en_vedette_dans_le_parc_de_Tarangire.jpg",
        ],
        "image_alt": "Elephants in Tarangire National Park.",
        "badge": "Elephant Country",
        "tags": ["Baobab Trees", "Elephant Herds"],
        "best_time_to_visit": "June – October",
        "highlight": "The largest elephant herds in Tanzania among iconic ancient baobab trees.",
        "about": (
            "Tarangire is famous for its dense elephant populations and towering baobab trees, while Lake "
            "Manyara's groundwater forest is known for its tree-climbing lions and flamingo flocks."
        ),
        "wildlife": "Massive elephant herds, tree-climbing lions, and over 550 recorded bird species.",
        "getting_there": "A 1.5-2 hour drive southwest of Arusha.",
    },
    {
        "slug": "zanzibar-beaches",
        "region_slug": "zanzibar",
        "name": "Zanzibar Beaches & Stone Town",
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/White_sandy_beach_at_Nungwi%2C_Zanzibar.jpg/1280px-White_sandy_beach_at_Nungwi%2C_Zanzibar.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Dhow_and_Anchor_on_the_Beach%2C_East_Coast_of_Zanzibar%2C_Tanzania_-_panoramio.jpg/1280px-Dhow_and_Anchor_on_the_Beach%2C_East_Coast_of_Zanzibar%2C_Tanzania_-_panoramio.jpg",
        ],
        "image_alt": "The white sandy beach at Nungwi, Zanzibar.",
        "badge": "Spice Island",
        "tags": ["Beaches", "Stone Town"],
        "best_time_to_visit": "June – October",
        "highlight": "Pristine white-sand beaches, historic Stone Town, and world-class reef diving.",
        "about": (
            "The perfect post-safari extension — Zanzibar's turquoise water, historic Stone Town, and spice "
            "farms give it a character all its own."
        ),
        "wildlife": "World-class reef diving and snorkeling — turtles, reef sharks, and vibrant coral gardens.",
        "getting_there": "A short domestic flight from Arusha or Dar es Salaam.",
    },
]


class Command(BaseCommand):
    help = "Seed (or update) the parks table — specific attractions scoped to a region."

    @transaction.atomic
    def handle(self, *args, **options):
        for entry in PARKS:
            slug = entry["slug"]
            region_slug = entry.pop("region_slug")
            region = Destination.objects.filter(slug=region_slug).first()
            if region is None:
                self.stdout.write(self.style.WARNING(f"Skipping {slug}: region '{region_slug}' not found"))
                entry["region_slug"] = region_slug
                continue
            defaults = {k: v for k, v in entry.items() if k != "slug"}
            defaults["region"] = region
            _, created = Park.objects.update_or_create(slug=slug, defaults=defaults)
            entry["region_slug"] = region_slug
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} {slug}"))
