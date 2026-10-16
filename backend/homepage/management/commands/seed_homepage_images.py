from django.core.management.base import BaseCommand
from django.db import transaction

from homepage.models import HomepageImage

# The hero video and its poster aren't seeded: until an admin replaces them,
# the site uses the video and still that ship with it (see siteImageDefaults.ts).
#
# The exact URLs Home.tsx used to hardcode, carried over so this command is a
# visual no-op on first run — nothing on the live site changes until an admin
# actually replaces one of these through the content manager.
_SLOT_DEFAULTS = {
    "why_choose": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Ngorongoro_jeep_safari_%2827333740440%29.jpg/1280px-Ngorongoro_jeep_safari_%2827333740440%29.jpg",
        "A safari vehicle on a game drive in the Ngorongoro Conservation Area.",
    ),
    "testimonial_sarah": (
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBFIMzrREe_jcC3X0qovnWDaglzRGvVy0TWU8RkvZ8FJFjt-G5ui8oQjFLRe3CjGQe2MWNdqNmotnl0vlV60AzI9bMFWwk2Q2eK5OjTg-v-gmsruDqc-NYDmoFI8Z5vwRsPWq1OlFUbnLj_zrLqx3krWRcM6QldqT6dEiHrROyL29Ks4Bdym0GDriAjvrOfWr3vdON_EefgGk_D94U9rguoRtCUh5hZdfcgEE7999SG7KSS1R32gbmq",
        "Portrait of Sarah Jenkins",
    ),
    "testimonial_markus": (
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCDRcYLtsIkom74XG5p6jZlqurQPzqTawzyhwQ6VXrrML45M24gF6_2XWFN9-a94dapRlzTqElUJ7UjxxyQuKE6SnAbUzrCjiczFOjpgbOZusViypZ-6K0Dl10Ox4FWyVTMexcAn2w_0U7rOHLYR3auBrDSGUthdHkhP48mSb2CswDWp9H7Dv5ckSe4T5Y2tLLzjuHSCKkT3ed6U1caTHsIIeNswwZpmrf8GSvDrf3zz5FL90q6PW_Z",
        "Portrait of Markus Weber",
    ),
}

class Command(BaseCommand):
    help = (
        "Seed the original homepage photo spots with the design's placeholders. "
        "Idempotent: an existing spot is left unchanged. Spots added later (other "
        "pages) aren't seeded: they show the frontend's built-in placeholder until "
        "an admin saves a replacement, which creates the row."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        for slot, (image, alt) in _SLOT_DEFAULTS.items():
            _, created = HomepageImage.objects.get_or_create(slot=slot, defaults={"image": image, "alt": alt})
            self.stdout.write(
                self.style.SUCCESS(f"Seeded {slot}") if created else f"Skipped {slot} (already set)"
            )
