from django.db import models

# Languages a member's text can be translated into, in addition to the English
# base fields. Mirrors website/src/i18n/locales.ts (SUPPORTED_LOCALES minus the
# default, 'en') — a new site language needs adding here too, or the admin
# form's save for that language is rejected with a clear error rather than
# silently dropped.
TRANSLATION_LOCALES = ("fr", "de", "pt")

# The text fields a translation may override, with their maximum lengths. These
# match the English base fields (title/photo_alt are CharFields with the same
# caps), so a translation can't hold something the English text couldn't.
# Anything a translation leaves empty falls back to the English base field on
# the frontend. Mirrored in website/src/api/team.ts (TEAM_LIMITS).
BIO_MAX_LENGTH = 2000
TRANSLATABLE_FIELD_LIMITS = {"title": 150, "bio": BIO_MAX_LENGTH, "photo_alt": 255}


class TeamMember(models.Model):
    """A person shown in the About page's "Meet the Experts" section.

    Deliberately separate from guides.Guide: that is the operational roster
    (ratings, availability, a login account) and includes people who aren't
    public-facing, while this is marketing copy for the site. English lives in
    the plain fields; other languages in `translations`, e.g.
    {"fr": {"title": "...", "bio": "...", "photo_alt": "..."}}.
    """

    name = models.CharField(max_length=150)
    title = models.CharField(max_length=150)
    bio = models.TextField()
    photo = models.URLField(max_length=500, blank=True)
    photo_alt = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(max_length=254, blank=True)
    translations = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name
