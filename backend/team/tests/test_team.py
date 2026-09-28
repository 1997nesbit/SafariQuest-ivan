from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from team.models import TeamMember

User = get_user_model()


class TeamMemberAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("team-member-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.published = TeamMember.objects.create(
            name="Juma Mdoe", title="Senior Field Guide", bio="Tracks predators.", order=1
        )
        self.first = TeamMember.objects.create(name="Amina Salim", title="Director", bio="Hosts guests.", order=0)
        self.draft = TeamMember.objects.create(
            name="Draft Person", title="Nobody yet", bio="Not live.", order=2, is_published=False
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def _detail(self, member):
        return reverse("team-member-detail", args=[member.id])

    # --- reading -----------------------------------------------------------

    def test_anonymous_lists_published_members_in_order(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([m["name"] for m in response.data], ["Amina Salim", "Juma Mdoe"])

    def test_list_is_not_paginated(self):
        response = self.client.get(self.list_url)
        self.assertIsInstance(response.data, list)

    def test_unpublished_member_is_hidden_from_anonymous_detail(self):
        response = self.client.get(self._detail(self.draft))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_list_is_published_only_by_default(self):
        """A logged-in admin browsing the public About page must see what visitors see."""
        self._login_as(self.admin)
        response = self.client.get(self.list_url)
        self.assertNotIn("Draft Person", [m["name"] for m in response.data])

    def test_admin_can_list_drafts_with_all_flag(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url, {"all": "true"})
        self.assertIn("Draft Person", [m["name"] for m in response.data])

    def test_all_flag_is_ignored_for_non_admins(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url, {"all": "true"})
        self.assertNotIn("Draft Person", [m["name"] for m in response.data])

    def test_admin_can_retrieve_a_draft_to_edit_it(self):
        self._login_as(self.admin)
        response = self.client.get(self._detail(self.draft))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Draft Person")

    # --- writing -----------------------------------------------------------

    def test_anonymous_and_non_admin_cannot_create(self):
        payload = {"name": "New", "title": "T", "bio": "B"}
        self.assertEqual(self.client.post(self.list_url, payload).status_code, status.HTTP_401_UNAUTHORIZED)
        self._login_as(self.tourist)
        self.assertEqual(self.client.post(self.list_url, payload).status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_update_or_delete(self):
        self._login_as(self.tourist)
        self.assertEqual(
            self.client.patch(self._detail(self.published), {"name": "Hacked"}).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(self.client.delete(self._detail(self.published)).status_code, status.HTTP_403_FORBIDDEN)
        self.published.refresh_from_db()
        self.assertEqual(self.published.name, "Juma Mdoe")

    def test_admin_can_create_update_and_delete(self):
        self._login_as(self.admin)
        created = self.client.post(
            self.list_url,
            {"name": "Elias Nyerere", "title": "Architect", "bio": "Plans routes.", "order": 5},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        member = TeamMember.objects.get(name="Elias Nyerere")
        self.assertTrue(member.is_published)

        updated = self.client.patch(self._detail(member), {"title": "Head Architect"}, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        member.refresh_from_db()
        self.assertEqual(member.title, "Head Architect")

        self.assertEqual(self.client.delete(self._detail(member)).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TeamMember.objects.filter(pk=member.pk).exists())

    # --- translations ------------------------------------------------------

    def _post_with_translations(self, translations):
        self._login_as(self.admin)
        return self.client.post(
            self.list_url,
            {"name": "T", "title": "Title", "bio": "Bio", "translations": translations},
            format="json",
        )

    def test_valid_translations_are_stored(self):
        response = self._post_with_translations(
            {"fr": {"title": "Titre", "bio": "Bio fr", "photo_alt": "Alt fr"}, "de": {"bio": "Bio de"}}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["translations"]["fr"]["title"], "Titre")
        self.assertEqual(response.data["translations"]["de"], {"bio": "Bio de"})

    def test_empty_translations_are_dropped_so_fallback_is_by_absence(self):
        response = self._post_with_translations(
            {"fr": {"title": "  ", "bio": ""}, "de": {"title": "Titel", "bio": ""}, "pt": {}}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["translations"], {"de": {"title": "Titel"}})

    def test_unknown_language_is_rejected(self):
        response = self._post_with_translations({"xx": {"title": "Nope"}})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("translations", response.data)

    def test_english_is_not_a_translation_key(self):
        """English is the base field; a duplicate under 'en' would be ambiguous about which wins."""
        response = self._post_with_translations({"en": {"title": "Nope"}})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_translated_field_is_rejected(self):
        response = self._post_with_translations({"fr": {"name": "Not translatable"}})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_text_translation_value_is_rejected(self):
        response = self._post_with_translations({"fr": {"title": 123}})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_translations_must_be_an_object(self):
        response = self._post_with_translations(["fr"])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TeamMemberFieldLimitTests(APITestCase):
    def setUp(self):
        self.url = reverse("team-member-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.client.post(reverse("login"), {"email": "admin@example.com", "password": "pw12345"})

    def _create(self, **overrides):
        payload = {"name": "Name", "title": "Title", "bio": "Bio", **overrides}
        return self.client.post(self.url, payload, format="json")

    def test_required_fields_cannot_be_blank_or_whitespace(self):
        for field in ("name", "title", "bio"):
            self.assertEqual(self._create(**{field: "   "}).status_code, status.HTTP_400_BAD_REQUEST, field)

    def test_bio_has_a_length_limit(self):
        self.assertEqual(self._create(bio="x" * 2000).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self._create(bio="x" * 2001).status_code, status.HTTP_400_BAD_REQUEST)

    def test_name_and_title_are_capped_at_150(self):
        self.assertEqual(self._create(name="n" * 151).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._create(title="t" * 151).status_code, status.HTTP_400_BAD_REQUEST)

    def test_translations_share_the_same_length_limits_as_english(self):
        """A translation must not hold something the English field would have refused."""
        for field, too_long in (("title", 151), ("bio", 2001), ("photo_alt", 256)):
            response = self._create(translations={"fr": {field: "x" * too_long}})
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, field)
        ok = self._create(translations={"fr": {"title": "x" * 150, "bio": "x" * 2000, "photo_alt": "x" * 255}})
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)

    def test_photo_must_be_an_http_url(self):
        self.assertEqual(self._create(photo="https://example.com/a.jpg").status_code, status.HTTP_201_CREATED)
        self.assertEqual(self._create(photo="").status_code, status.HTTP_201_CREATED)
        for bad in ("ftp://example.com/a.jpg", "javascript:alert(1)", "not a url", "/relative/path.jpg"):
            self.assertEqual(self._create(photo=bad).status_code, status.HTTP_400_BAD_REQUEST, bad)

    def test_order_must_be_a_non_negative_whole_number(self):
        self.assertEqual(self._create(order=0).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self._create(order=-1).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._create(order=1.5).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._create(order="abc").status_code, status.HTTP_400_BAD_REQUEST)

    def test_updating_with_invalid_data_leaves_the_record_unchanged(self):
        member = TeamMember.objects.create(name="Keep", title="T", bio="B")
        response = self.client.patch(
            reverse("team-member-detail", args=[member.id]), {"bio": "x" * 2001}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        member.refresh_from_db()
        self.assertEqual(member.bio, "B")

    def test_deleting_a_missing_member_is_a_404(self):
        self.assertEqual(
            self.client.delete(reverse("team-member-detail", args=[999999])).status_code, status.HTTP_404_NOT_FOUND
        )


class SeedTeamCommandTests(APITestCase):
    def test_does_not_crash_when_two_members_share_a_name(self):
        TeamMember.objects.create(name="Juma Mdoe", title="A", bio="a")
        TeamMember.objects.create(name="Juma Mdoe", title="B", bio="b")
        call_command("seed_team", stdout=StringIO())
        self.assertEqual(TeamMember.objects.filter(name="Juma Mdoe").count(), 2)
        self.assertEqual(TeamMember.objects.count(), 4)  # the two Jumas + Amina + Elias

    def test_seeds_the_three_original_members_with_all_languages(self):
        call_command("seed_team", stdout=StringIO())
        self.assertEqual(TeamMember.objects.count(), 3)
        juma = TeamMember.objects.get(name="Juma Mdoe")
        self.assertEqual(sorted(juma.translations), ["de", "fr", "pt"])
        self.assertTrue(juma.translations["fr"]["bio"])

    def test_rerunning_never_overwrites_admin_edits(self):
        call_command("seed_team", stdout=StringIO())
        TeamMember.objects.filter(name="Juma Mdoe").update(title="Edited in admin")
        call_command("seed_team", stdout=StringIO())
        self.assertEqual(TeamMember.objects.count(), 3)
        self.assertEqual(TeamMember.objects.get(name="Juma Mdoe").title, "Edited in admin")
