from django.db import models

ALT_MAX_LENGTH = 255

# Every fixed photo spot on the public site that isn't already backed by another
# model (a safari package, a destination, ...), so the client can swap the
# design's AI-generated placeholders for real photography without a deploy.
# Each spot has at most one row; a spot with no row yet falls back to the
# frontend's built-in placeholder, and the first admin save creates the row.
# Mirrored in website/src/api/homepage.ts (SITE_IMAGE_SLOTS), which also groups
# them by page for the content manager.
HOMEPAGE_SLOTS = (
    # Homepage
    # The homepage hero is always a video. `hero_video` holds a video URL (in the
    # `image` field, like every other spot); `hero_poster` is the still shown while
    # it loads and to visitors who've turned motion off.
    ("hero_video", "Homepage – hero video"),
    ("hero_poster", "Homepage – hero video poster"),
    ("why_choose", 'Homepage – "Why choose us" photo'),
    ("testimonial_sarah", "Homepage – testimonial avatar (Sarah)"),
    ("testimonial_markus", "Homepage – testimonial avatar (Markus)"),
    # About
    ("about_hero", "About – hero"),
    ("about_story", "About – our story photo"),
    # Safaris listing
    ("safaris_hero", "Safaris – hero"),
    # FAQs
    ("faqs_hero", "FAQs – hero"),
    # Sign in
    ("sign_in", "Sign in – side photo"),
    # Booking confirmed
    ("booking_confirmed_hero", "Booking confirmed – main photo"),
    ("booking_confirmed_packing", "Booking confirmed – packing guide photo"),
    ("booking_confirmed_photography", "Booking confirmed – photography tips photo"),
)


class HomepageImage(models.Model):
    """One row per fixed photo spot (see HOMEPAGE_SLOTS). Named for where the
    feature started; it now covers every page's fixed photos, not just the homepage.

    `slot` is unique, so there is always at most one row per spot. A spot with no
    row is `None` to the frontend, which then falls back to its own built-in
    default rather than showing a broken image. Deleting a row ("reset to
    original") is how an admin goes back to that default.
    """

    slot = models.CharField(max_length=40, choices=HOMEPAGE_SLOTS, unique=True)
    image = models.URLField(max_length=500)
    alt = models.CharField(max_length=ALT_MAX_LENGTH, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slot"]

    def __str__(self):
        return self.get_slot_display()


class PartnerHotel(models.Model):
    """A hotel or lodge Pande works with, listed on the homepage with a link to its
    own website, under a note that the property, not Pande, answers for what happens
    there (power, water, safety). Took the place of the old homepage gallery strip.
    """

    name = models.CharField(max_length=150)
    location = models.CharField(max_length=120, blank=True)
    website = models.URLField(max_length=500)
    # Optional: a logo or a photo of the property. Without one, the card shows the name only.
    image = models.URLField(max_length=500, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name
