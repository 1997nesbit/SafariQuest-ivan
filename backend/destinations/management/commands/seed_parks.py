from django.core.management.base import BaseCommand
from django.db import transaction

from destinations.models import Destination, Park

PARKS = [
    {
        "slug": "serengeti-national-park",
        "region_slug": "arusha",
        "name": "Serengeti National Park",
        "images": [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAoQ8aw9davA-RWilN94ayaNTOz7CiiJ2XTgnA0DDDmkU2QaW6sVhThlWIZsFoYkp009Aa5x3jyvstRVCNWEovr4oz3wgG7__cQ-jXtKMzCdBRCFnEW9lHS00u3_-TeuktekzShoXSPXG8J4eQHA-nOh3n6LeEk3snnsY-rIe-onI77fg3DYEOBXCBTGp87dCj53kul8qBvE987k4Q_sbtSFh3SY0HLRgugSeqTPdAHfdzSTzexfaAA",
        ],
        "image_alt": "Wildebeest and zebra crossing the golden plains of the Serengeti during the Great Migration.",
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
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDPyhDrd52YtZRfG6DIfu-rnT37CdQTFhP4FmOJfgHiIdQUSAl6C2qufJgzIgXVI2H0IAMvzh2GAjntewndcMsS4KZvw3qdFMQV5qJinJaZ2c0k5VnROe023X_I6adtMkQIXzQJNZ6DcgMCsdYTqt0k5Vr_RU5gRUi_pYrLrQcyOAoiFPu2xfyqaU_YbQlxkiAVTLhjRarSTwP6FZMhKFyl88JTtIM84XnRMfKBRANx01R7oKHhlXNz",
        ],
        "image_alt": "A misty aerial view over the lush Ngorongoro Crater floor at dawn.",
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
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDU1iCtnX6Vmni4kllKE2_qqm_mWuSt39fWinfX8oSFQuclS6StucrEs0qGIOOsy0j804VVt8AyGMPHJDLUORiuEOAwtU1lLhqKddquLnktuKa-GLCNHHyqp3UcFowY4bWwufimUl2UEwvr0a6h4XWl6qWEk45N_xJVmjg4RVE2mY_GfwMbZPI2Lc6jC42Z6-miMYTvCes_wL0FTZXZc_bYcYAvaoZMELgSB2dDawE-IWRvX6aThwd6",
        ],
        "image_alt": "A herd of elephants walking among ancient baobab trees in Tarangire at sunset.",
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
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBiT4F0xOfh1a_LBJ_WmUFp3fwNPJiIzklS_5ts363dZXe9EhilFlc9YRUaoE064aEPznQ33BTbq8fohHx-aK5Gb3wa_rsz1x6GfCesAR900fukEo-FHEdEmYtHv1egyaHC6xKbYOgJxaygvYjPk9oGM71ldYGtWF381DlVRLvAX_f9kKUdkGJRMTaOaR2QpgukHOOVf6lO0asBTXeIg0DYOtNEDL8zQtUfrq9z8NAWgHnC0vChD-6y",
        ],
        "image_alt": "A white sand Zanzibar beach with turquoise water and a traditional dhow sailboat.",
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
