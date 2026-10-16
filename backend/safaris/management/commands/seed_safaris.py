from django.core.management.base import BaseCommand
from django.db import transaction

from destinations.models import Park
from safaris.models import ItineraryDay, SafariPackage

SAFARIS = [
    {
        "slug": "great-migration-path",
        "title": "Great Migration Path",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2b.jpg/1280px-Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2b.jpg",
        "image_alt": "Wildebeest crossing the Mara River in the northern Serengeti.",
        "gallery_images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2a_Zebras.jpg/1280px-Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2a_Zebras.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2c.jpg/1280px-Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2c.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2f_jumping.jpg/1280px-Western_white-bearded_wildebeest_%28Connochaetes_taurinus_mearnsi%29_Mara_River_crossing_2f_jumping.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/9117_Serengeti_migration_JF.jpg/1280px-9117_Serengeti_migration_JF.jpg",
        ],
        "rating": "4.9",
        "days": 8,
        "accommodation": "Luxury Tents",
        "price": 4250,
        "badge": "Most Popular",
        "signature": True,
        "destination": "Serengeti National Park",
        "park_slugs": ["serengeti-national-park", "ngorongoro-conservation-area"],
        "overview": (
            "Follow the herds across the Serengeti's endless plains in this once-in-a-lifetime spectacle of "
            "nature's greatest journey, tracking the Great Migration from luxury tented camps."
        ),
        "highlights": [
            "Great Migration river crossings",
            "Big cat tracking with expert guides",
            "Hot air balloon safari add-on",
            "Maasai cultural visit",
        ],
        "included": [
            "Private 4x4 Land Cruiser & driver-guide",
            "All park fees & concession permits",
            "Luxury tented camp accommodation",
            "All meals & selected drinks",
        ],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Arusha", "description": "Airport pickup and transfer to a private lodge for a briefing dinner with your guide."},
            {"day": 2, "title": "Serengeti North", "description": "Fly to the northern Serengeti and settle into camp with an introductory evening game drive."},
            {"day": 3, "title": "Mara River Crossing", "description": "Full day tracking herds along the Mara River, watching for dramatic crossing attempts."},
            {"day": 4, "title": "Central Serengeti", "description": "Transfer south to the Seronera valley, prime territory for lion and leopard sightings."},
            {"day": 5, "title": "Balloon Safari & Game Drive", "description": "Optional sunrise balloon flight followed by a champagne breakfast and afternoon drive."},
            {"day": 6, "title": "Ngorongoro Crater", "description": "Descend into the crater floor for a full day among dense concentrations of wildlife."},
            {"day": 7, "title": "Maasai Cultural Visit", "description": "Morning visit to a local Maasai village followed by a relaxed afternoon at camp."},
            {"day": 8, "title": "Departure", "description": "Final morning game drive, then transfer to Kilimanjaro International Airport."},
        ],
    },
    {
        "slug": "ngorongoro-exclusive",
        "title": "Ngorongoro Exclusive",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Ngorongoro_Conservation_Area_2021-01_-_the_crater_from_the_rim.jpg/1280px-Ngorongoro_Conservation_Area_2021-01_-_the_crater_from_the_rim.jpg",
        "image_alt": "The Ngorongoro Crater seen from its forested rim.",
        "rating": "5.0",
        "days": 5,
        "accommodation": "Safari Lodge",
        "price": 2800,
        "badge": "",
        "signature": True,
        "destination": "Ngorongoro Conservation Area",
        "park_slugs": ["ngorongoro-conservation-area", "tarangire-manyara"],
        "overview": (
            "Descend into the caldera for unmatched wildlife density, returning to premium lodge comfort "
            "perched on the crater rim each evening."
        ),
        "highlights": [
            "Full-day Ngorongoro Crater floor drive",
            "Black rhino tracking",
            "Crater-rim lodge with panoramic views",
            "Olduvai Gorge archaeological stop",
        ],
        "included": [
            "Private 4x4 Land Cruiser & driver-guide",
            "Crater entry & conservation fees",
            "Lodge accommodation, crater-view rooms",
            "All meals",
        ],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Transfer", "description": "Pickup from Kilimanjaro International Airport and scenic drive to the crater rim."},
            {"day": 2, "title": "Olduvai Gorge", "description": "Visit the site of some of humanity's earliest fossil discoveries en route to the highlands."},
            {"day": 3, "title": "Crater Floor Descent", "description": "Full day exploring the caldera floor — lion prides, flamingo lakes, and black rhino."},
            {"day": 4, "title": "Lake Manyara Extension", "description": "Morning drive through the groundwater forest, famous for tree-climbing lions."},
            {"day": 5, "title": "Departure", "description": "Relaxed breakfast with crater views before transfer to the airport."},
        ],
    },
    {
        "slug": "tarangire-giants",
        "title": "Tarangire Giants",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Un_g%C3%A9ant_tranquille%2C_%C3%A9l%C3%A9phant_aper%C3%A7u_au_parc_national_de_Tarangire.jpg/1280px-Un_g%C3%A9ant_tranquille%2C_%C3%A9l%C3%A9phant_aper%C3%A7u_au_parc_national_de_Tarangire.jpg",
        "image_alt": "An elephant in Tarangire National Park.",
        "rating": "4.8",
        "days": 4,
        "accommodation": "Mobile Camp",
        "price": 1950,
        "badge": "",
        "signature": True,
        "destination": "Tarangire & Manyara",
        "park_slugs": ["tarangire-manyara"],
        "overview": (
            "A short but spectacular escape to the land of giants, famous for its dense elephant populations "
            "and iconic baobab-studded landscapes."
        ),
        "highlights": [
            "Largest elephant herds in Tanzania",
            "Iconic baobab tree landscapes",
            "Mobile tented camp under the stars",
            "Birdwatching along the Tarangire River",
        ],
        "included": ["Private 4x4 Land Cruiser & driver-guide", "Park fees", "Mobile tented camp accommodation", "All meals"],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Tarangire Entry", "description": "Transfer from Arusha into the park with an afternoon game drive along the river."},
            {"day": 2, "title": "Elephant Herds", "description": "Full day tracking Tarangire's famous elephant herds among ancient baobabs."},
            {"day": 3, "title": "Silale Swamp", "description": "Explore the swamp area, a magnet for wildlife even in the dry season."},
            {"day": 4, "title": "Departure", "description": "Final morning drive, then transfer back to Arusha."},
        ],
    },
    {
        "slug": "big-five-pursuit",
        "title": "The Big Five Pursuit",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Leopard_tree_Serengeti-1.jpg/1280px-Leopard_tree_Serengeti-1.jpg",
        "image_alt": "A leopard resting in a tree in the Serengeti.",
        "rating": "4.9",
        "days": 10,
        "accommodation": "Luxury Tents",
        "price": 5600,
        "badge": "",
        "signature": False,
        "destination": "Serengeti National Park",
        "park_slugs": ["serengeti-national-park", "ngorongoro-conservation-area", "tarangire-manyara"],
        "overview": (
            "An extended, expert-led pursuit of the Big Five across the Serengeti ecosystem, timed and routed "
            "for maximum sighting density."
        ),
        "highlights": [
            "Dedicated Big Five tracking specialist",
            "Extended Seronera Valley stay",
            "Private night-drive concession access",
            "Small-group, low-density camps",
        ],
        "included": [
            "Private 4x4 Land Cruiser & driver-guide",
            "All park & concession fees",
            "Luxury tented camp accommodation",
            "All meals & selected drinks",
        ],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Arusha", "description": "Briefing dinner with your Big Five tracking specialist."},
            {"day": 2, "title": "Seronera Valley", "description": "Fly into central Serengeti, prime leopard and lion territory."},
            {"day": 3, "title": "Leopard Tracking", "description": "Full day focused on the valley's resident leopard population."},
            {"day": 4, "title": "Rhino Concession", "description": "Private concession access for a chance at the elusive black rhino."},
            {"day": 5, "title": "Buffalo Herds", "description": "Track large buffalo herds along the western corridor."},
            {"day": 6, "title": "Night Drive", "description": "Private concession night drive for nocturnal predator activity."},
            {"day": 7, "title": "Ngorongoro Crater", "description": "Full day crater floor drive rounding out the Big Five checklist."},
            {"day": 8, "title": "Elephant Herds", "description": "Transfer to Tarangire for a day among its famous elephant populations."},
            {"day": 9, "title": "Free Safari Day", "description": "Flexible day to revisit any sighting or simply relax at camp."},
            {"day": 10, "title": "Departure", "description": "Final game drive, then transfer to the airport."},
        ],
    },
    {
        "slug": "sky-and-savanna",
        "title": "Sky & Savanna",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Serengeti_Balloon.jpg/1280px-Serengeti_Balloon.jpg",
        "image_alt": "A hot air balloon coming in to land over the Serengeti just after sunrise.",
        "rating": "4.7",
        "days": 6,
        "accommodation": "Premier Lodge",
        "price": 3900,
        "badge": "",
        "signature": False,
        "destination": "Serengeti National Park",
        "park_slugs": ["serengeti-national-park"],
        "overview": (
            "A scenic-first safari built around sunrise balloon flights, golden-hour game drives, and premier "
            "lodge comfort above the plains."
        ),
        "highlights": [
            "Two sunrise hot air balloon flights",
            "Champagne bush breakfasts",
            "Premier lodge with plains views",
            "Golden-hour photography drives",
        ],
        "included": [
            "Private 4x4 Land Cruiser & driver-guide",
            "Two balloon safari flights",
            "Premier lodge accommodation",
            "All meals & selected drinks",
        ],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Lodge Check-in", "description": "Transfer to your premier lodge overlooking the plains."},
            {"day": 2, "title": "Sunrise Balloon Flight", "description": "Dawn balloon safari followed by a champagne bush breakfast."},
            {"day": 3, "title": "Golden-Hour Game Drive", "description": "Photography-focused drive timed around the best light of the day."},
            {"day": 4, "title": "Second Balloon Flight", "description": "A second sunrise flight over a different stretch of the plains."},
            {"day": 5, "title": "Free Exploration", "description": "A relaxed day at your own pace, with an optional walking safari."},
            {"day": 6, "title": "Departure", "description": "Final breakfast with plains views, then transfer to the airport."},
        ],
    },
    {
        "slug": "bush-to-beach",
        "title": "Bush to Beach",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Dhow_boat_Zanzibar.jpg/1280px-Dhow_boat_Zanzibar.jpg",
        "image_alt": "A traditional dhow sailing off the coast of Zanzibar.",
        "rating": "5.0",
        "days": 12,
        "accommodation": "Resort & Tent",
        "price": 6400,
        "badge": "",
        "signature": False,
        "destination": "Zanzibar Extensions",
        "park_slugs": ["tarangire-manyara", "ngorongoro-conservation-area", "serengeti-national-park", "zanzibar-beaches"],
        "overview": (
            "The complete Tanzanian journey: a week of classic safari across the northern circuit followed by "
            "five days unwinding on Zanzibar's beaches."
        ),
        "highlights": [
            "Northern circuit safari (Serengeti, Ngorongoro, Tarangire)",
            "Zanzibar beach resort extension",
            "Stone Town history & spice tour",
            "Sunset dhow cruise",
        ],
        "included": [
            "Private 4x4 Land Cruiser & driver-guide (safari leg)",
            "Domestic flight to Zanzibar",
            "Camp & resort accommodation",
            "All meals on safari, breakfast on the coast",
        ],
        "excluded": ["International flights", "Visa fees", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Arusha", "description": "Briefing dinner and safari preparation."},
            {"day": 2, "title": "Tarangire National Park", "description": "Game drives among elephant herds and baobab trees."},
            {"day": 3, "title": "Ngorongoro Crater", "description": "Full day crater floor exploration."},
            {"day": 4, "title": "Serengeti North", "description": "Fly to the Serengeti for migration tracking."},
            {"day": 5, "title": "Mara River", "description": "Full day at the river watching for crossings."},
            {"day": 6, "title": "Central Serengeti", "description": "Big cat tracking in the Seronera valley."},
            {"day": 7, "title": "Fly to Zanzibar", "description": "Domestic flight from the Serengeti to Zanzibar's coast."},
            {"day": 8, "title": "Stone Town & Spice Tour", "description": "Guided walk through historic Stone Town and a local spice farm."},
            {"day": 9, "title": "Beach Day", "description": "Free day at your beach resort."},
            {"day": 10, "title": "Sunset Dhow Cruise", "description": "Traditional sailboat cruise along the coast at sunset."},
            {"day": 11, "title": "Free Beach Day", "description": "Relax, dive, or snorkel at your own pace."},
            {"day": 12, "title": "Departure", "description": "Transfer to Zanzibar International Airport."},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed (or update) the safari packages table from the original landing-page mock content."

    @transaction.atomic
    def handle(self, *args, **options):
        for entry in SAFARIS:
            itinerary = entry.pop("itinerary")
            slug = entry["slug"]
            park_slugs = entry.pop("park_slugs", [])
            defaults = {k: v for k, v in entry.items() if k != "slug"}
            safari, created = SafariPackage.objects.update_or_create(slug=slug, defaults=defaults)
            safari.parks.set(Park.objects.filter(slug__in=park_slugs))
            safari.itinerary.all().delete()
            for day in itinerary:
                ItineraryDay.objects.create(safari=safari, **day)
            entry["itinerary"] = itinerary
            entry["park_slugs"] = park_slugs
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} {slug}"))
