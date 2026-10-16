from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from homepage.models import HomepageImage, PartnerHotel

User = get_user_model()


class HomepageImageAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.slot = HomepageImage.objects.create(slot="hero_poster", image="https://example.com/hero.jpg", alt="Hero")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def _detail(self):
        return reverse("homepage-image-detail", args=["hero_poster"])

    def test_anyone_can_read_slots(self):
        response = self.client.get(reverse("homepage-image-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_anonymous_cannot_update_a_slot(self):
        response = self.client.patch(self._detail(), {"image": "https://example.com/new.jpg"}, format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_tourist_cannot_update_a_slot(self):
        self._login_as(self.tourist)
        response = self.client.patch(self._detail(), {"image": "https://example.com/new.jpg"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_a_slots_image_and_alt(self):
        self._login_as(self.admin)
        response = self.client.patch(
            self._detail(), {"image": "https://example.com/new.jpg", "alt": "New hero"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.image, "https://example.com/new.jpg")

    def test_a_slots_key_cannot_be_changed(self):
        self._login_as(self.admin)
        response = self.client.patch(self._detail(), {"slot": "why_choose"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.slot, "hero_poster")

    def test_rejects_a_non_http_image_url(self):
        self._login_as(self.admin)
        response = self.client.patch(self._detail(), {"image": "ftp://example.com/new.jpg"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_there_is_no_create_endpoint(self):
        self._login_as(self.admin)
        response = self.client.post(
            reverse("homepage-image-list"), {"slot": "why_choose", "image": "https://example.com/a.jpg"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_admin_can_reset_a_spot_to_its_original(self):
        """Deleting the row is "reset to original": the site falls back to its default."""
        self._login_as(self.admin)
        response = self.client.delete(self._detail())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(HomepageImage.objects.filter(slot="hero_poster").exists())

    def test_tourist_cannot_reset_a_spot(self):
        self._login_as(self.tourist)
        response = self.client.delete(self._detail())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(HomepageImage.objects.filter(slot="hero_poster").exists())


class HomepageImageCreateOnFirstSaveTests(APITestCase):
    """Spots added for other pages have no row until an admin first saves one."""

    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_saving_a_known_spot_without_a_row_creates_it(self):
        self._login_as(self.admin)
        response = self.client.patch(
            reverse("homepage-image-detail", args=["about_hero"]),
            {"image": "https://example.com/about.jpg", "alt": "Our team"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        row = HomepageImage.objects.get(slot="about_hero")
        self.assertEqual(row.image, "https://example.com/about.jpg")

    def test_hero_video_spot_takes_a_video_url(self):
        self._login_as(self.admin)
        response = self.client.patch(
            reverse("homepage-image-detail", args=["hero_video"]),
            {"image": "https://cdn.example.com/uploads/videos/hero.mp4"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_unknown_spot_is_404(self):
        self._login_as(self.admin)
        response = self.client.patch(
            reverse("homepage-image-detail", args=["not_a_spot"]), {"image": "https://example.com/a.jpg"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(HomepageImage.objects.filter(slot="not_a_spot").exists())

    def test_creating_a_spot_still_needs_an_image(self):
        self._login_as(self.admin)
        response = self.client.patch(reverse("homepage-image-detail", args=["faqs_hero"]), {"alt": "x"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tourist_cannot_create_a_spot(self):
        self._login_as(self.tourist)
        response = self.client.patch(
            reverse("homepage-image-detail", args=["about_hero"]), {"image": "https://example.com/a.jpg"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(HomepageImage.objects.exists())


class PartnerHotelAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("partner-hotel-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.second = PartnerHotel.objects.create(name="Arusha Lodge", website="https://arusha.example.com", order=1)
        self.first = PartnerHotel.objects.create(name="Zanzibar Beach Resort", website="https://zanzibar.example.com", order=0)
        self.hidden = PartnerHotel.objects.create(
            name="Hidden Camp", website="https://hidden.example.com", order=2, is_published=False
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def _payload(self, **overrides):
        payload = {"name": "Serengeti Camp", "location": "Serengeti", "website": "https://camp.example.com"}
        payload.update(overrides)
        return payload

    def test_anonymous_sees_published_hotels_in_order(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([h["name"] for h in response.data], ["Zanzibar Beach Resort", "Arusha Lodge"])

    def test_hidden_hotel_is_404_for_anonymous_detail(self):
        response = self.client.get(reverse("partner-hotel-detail", args=[self.hidden.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_sees_hidden_only_with_all_true(self):
        self._login_as(self.admin)
        self.assertEqual(len(self.client.get(self.list_url).data), 2)
        self.assertEqual(len(self.client.get(self.list_url, {"all": "true"}).data), 3)

    def test_all_flag_is_ignored_for_non_admins(self):
        self._login_as(self.tourist)
        self.assertEqual(len(self.client.get(self.list_url, {"all": "true"}).data), 2)

    def test_only_admins_can_create(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_name_and_website_are_required(self):
        self._login_as(self.admin)
        for field in ("name", "website"):
            payload = self._payload()
            del payload[field]
            response = self.client.post(self.list_url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, field)
            self.assertIn(field, response.data)

    def test_blank_name_is_rejected(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self._payload(name="   "), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_non_web_links_are_rejected(self):
        self._login_as(self.admin)
        for website in ("javascript:alert(1)", "ftp://example.com", "example.com"):
            response = self.client.post(self.list_url, self._payload(website=website), format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, website)
            self.assertIn("website", response.data)

    def test_non_http_image_is_rejected(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self._payload(image="ftp://example.com/a.jpg"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)


class SeedHomepageImagesCommandTests(APITestCase):
    def test_seed_creates_the_original_homepage_spots_except_the_hero_and_is_idempotent(self):
        call_command("seed_homepage_images")
        self.assertEqual(HomepageImage.objects.count(), 3)
        # The hero video and poster aren't seeded; the site uses its built-in ones.
        self.assertFalse(HomepageImage.objects.filter(slot__in=["hero_video", "hero_poster"]).exists())

        call_command("seed_homepage_images")
        self.assertEqual(HomepageImage.objects.count(), 3)
