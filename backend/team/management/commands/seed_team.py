from django.core.management.base import BaseCommand
from django.db import transaction

from team.models import TeamMember

# The three people the About page used to hardcode, carried over with their
# existing English/French/German/Portuguese text so moving that section to the
# database loses nothing already translated.
#
# The photo URLs are the design-mockup placeholders the page shipped with
# (lh3.googleusercontent.com/aida-public/...): fine to see something on first
# deploy, but not URLs to rely on. Replace them with real photos from the
# admin (Content > Team) — they're uploaded to the site's own storage there.
TEAM_MEMBERS = [
    {
        "name": "Juma Mdoe",
        "order": 0,
        "photo": "https://lh3.googleusercontent.com/aida-public/AB6AXuD5enwguDy8qXqtZMfIG-73aAyI3euBWo3x4EDN22HTYzaDoMv2IhkJU6U6Z_r-Y3ERrwjnLaUH-Y6MZMbc7pfFrwtQVAM2aZTlZUBsqiaspB8IHAphQS5SRDKZ6XLzF5LWiByVNX8B4ckHipg5hBn8AHeRxGOw-8TQ31tD2pnv8w9n6eSjWZ-QnZAyFxS4AGzf03dyLGKySf3GbBoRsmRC_c5Tedm35c4NGC9r9iemG2YBZyna-0KM",
        "title": "Senior Field Guide & Tracker",
        "bio": "With over a decade of tracking experience in the Serengeti, Juma's intimate knowledge of predator behavior ensures you're always in the right place at the right time.",
        "photo_alt": "A professional portrait of Juma Mdoe, a Tanzanian safari field guide, standing against a blurred acacia woodland.",
        "translations": {
            "fr": {
                "title": "Guide de terrain senior et pisteur",
                "bio": "Fort de plus d'une décennie d'expérience de pistage dans le Serengeti, la connaissance intime de Juma du comportement des prédateurs vous garantit d'être toujours au bon endroit, au bon moment.",
                "photo_alt": "Portrait professionnel de Juma Mdoe, guide de safari tanzanien, se tenant devant une forêt d'acacias floue."
            },
            "de": {
                "title": "Leitender Feldguide & Fährtenleser",
                "bio": "Mit über einem Jahrzehnt Tracking-Erfahrung in der Serengeti sorgt Jumas intime Kenntnis des Raubtierverhaltens dafür, dass Sie immer zur richtigen Zeit am richtigen Ort sind.",
                "photo_alt": "Professionelles Porträt von Juma Mdoe, einem tansanischen Safari-Feldguide, vor einem unscharfen Akazienwald."
            },
            "pt": {
                "title": "Guia de campo sénior e rastreador",
                "bio": "Com mais de uma década de experiência em rastreamento no Serengeti, o conhecimento profundo de Juma sobre o comportamento dos predadores garante que está sempre no lugar certo, na hora certa.",
                "photo_alt": "Retrato profissional de Juma Mdoe, guia de safári tanzaniano, junto a um bosque de acácias desfocado."
            }
        }
    },
    {
        "name": "Amina Salim",
        "order": 1,
        "photo": "https://lh3.googleusercontent.com/aida-public/AB6AXuB2gSq25f8PaKDrWwPErwUxswVJxrabBHpTwXuuqocSWMNhkUpFMXFIzgptK2_xYsBVXN0dZmAx-meHSEbUVy7qvGbqJfeRnI-m-M1JeMau5vmUAOkVYXfxny0nemPfj0ElZAbK2fEW7uDlUbXyW5F6eQi7ouDD_V4eCyax5kTEiZBIl5lQCKxIIYzAWcXYmQByA4sU0nA7AMPqR-p7uEtSOKS5qqto0DQvV-ON6LPH1oYTioFFR2Ns",
        "title": "Guest Experience Director",
        "bio": "Amina oversees every detail of your stay, from specialized dietary requirements to orchestrating surprise sundowner experiences in the bush.",
        "photo_alt": "A portrait of a Tanzanian safari lodge manager standing in front of an upscale canvas tent.",
        "translations": {
            "fr": {
                "title": "Directrice de l'expérience client",
                "bio": "Amina supervise chaque détail de votre séjour, des besoins alimentaires spécifiques à l'organisation de sundowners surprises dans la brousse.",
                "photo_alt": "Portrait d'une responsable de lodge de safari tanzanien devant une tente en toile haut de gamme."
            },
            "de": {
                "title": "Direktorin für Gästeerlebnis",
                "bio": "Amina überwacht jedes Detail Ihres Aufenthalts, von speziellen Ernährungsanforderungen bis zur Organisation überraschender Sundowner-Erlebnisse im Busch.",
                "photo_alt": "Porträt einer tansanischen Safari-Lodge-Managerin vor einem gehobenen Zeltbau."
            },
            "pt": {
                "title": "Diretora de experiência do hóspede",
                "bio": "Amina supervisiona cada detalhe da sua estadia, desde requisitos alimentares específicos até à organização de experiências surpresa ao pôr do sol no mato.",
                "photo_alt": "Retrato de uma gestora de um lodge de safári tanzaniano em frente a uma tenda de lona sofisticada."
            }
        }
    },
    {
        "name": "Elias Nyerere",
        "order": 2,
        "photo": "https://lh3.googleusercontent.com/aida-public/AB6AXuA9vfiPiRJgglE7Ui7OQsQ2_LbiHxT_UIEqyiXlDS5ttwg9tyJY-6X58OFp0aNIp7_ZZRZGKivgQZ2YGDwYtWbGc_Wl0M1e5GxRLxdQoVykc6TiHAaiTvWDesbSEX-0-GngyIPlkZkk8iWkgyQaX6gMW2GyOT7q2KOkJzLvp3lvVYp--L3EjlkVia8fi94yMyA3CH8tXf6_kxrp76vMxdCOzpu_GKDS-3Ly4LqM9C7G67SW06dUiQbs",
        "title": "Head Itinerary Architect",
        "bio": "Elias crafts our unique routes, ensuring you bypass the crowds to discover the most authentic and breathtaking corners of the parks.",
        "photo_alt": "A portrait of a senior Tanzanian conservationist and route planner looking across a savanna landscape.",
        "translations": {
            "fr": {
                "title": "Architecte en chef des itinéraires",
                "bio": "Elias conçoit nos itinéraires uniques, vous permettant d'éviter les foules pour découvrir les coins les plus authentiques et les plus époustouflants des parcs.",
                "photo_alt": "Portrait d'un conservationniste tanzanien senior et planificateur d'itinéraires regardant la savane."
            },
            "de": {
                "title": "Leitender Reiserouten-Architekt",
                "bio": "Elias entwirft unsere einzigartigen Routen, damit Sie den Menschenmassen ausweichen und die authentischsten und atemberaubendsten Ecken der Parks entdecken.",
                "photo_alt": "Porträt eines erfahrenen tansanischen Naturschützers und Routenplaners, der über eine Savannenlandschaft blickt."
            },
            "pt": {
                "title": "Arquiteto-chefe de itinerários",
                "bio": "Elias cria os nossos percursos únicos, garantindo que evite as multidões para descobrir os cantos mais autênticos e deslumbrantes dos parques.",
                "photo_alt": "Retrato de um conservacionista tanzaniano sénior e planeador de rotas a olhar para uma paisagem de savana."
            }
        }
    }
]


class Command(BaseCommand):
    help = (
        "Seed the About page's team members. Idempotent and non-destructive: a "
        "member that already exists (matched by name) is left exactly as it is, "
        "so re-running this never overwrites edits made in the admin."
    )

    def handle(self, *args, **options):
        with transaction.atomic():
            for entry in TEAM_MEMBERS:
                # exists() rather than get_or_create(): name isn't unique, and get_or_create
                # raises MultipleObjectsReturned if an admin ever adds a second person with
                # the same name, which would make this command crash instead of skipping.
                if TeamMember.objects.filter(name=entry["name"]).exists():
                    self.stdout.write(f"Skipped {entry['name']} (already exists)")
                    continue
                TeamMember.objects.create(**entry)
                self.stdout.write(self.style.SUCCESS(f"Created {entry['name']}"))
