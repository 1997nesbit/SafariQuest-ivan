"""One login, two hats: a tourist account can switch on the referral agent profile."""

import importlib

from django.apps import apps
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.tests.test_pay import make_booking
from referrals.models import ReferralCode, ReferralRedemption

User = get_user_model()

PASSWORD = "pw12345"
STRONG_PASSWORD = "Kilimanjaro-5895m"


class AgentProfileTests(APITestCase):
    def setUp(self):
        self.tourist = User.objects.create_user(email="traveller@example.com", password=PASSWORD, role="tourist")
        self.agent = User.objects.create_user(
            email="hotel@example.com", password=PASSWORD, role="tourist", is_referral_agent=True
        )
        self.guide = User.objects.create_user(email="guide@example.com", password=PASSWORD, role="guide")
        self.admin = User.objects.create_user(email="admin@example.com", password=PASSWORD, role="admin")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": PASSWORD})

    # --- migration ---------------------------------------------------------

    def test_migration_turns_legacy_agents_into_tourists_with_the_profile(self):
        migration = importlib.import_module("accounts.migrations.0004_referral_agent_profile")
        legacy = User.objects.create_user(email="legacy@example.com", password=PASSWORD, role="tourist")
        # The old role value is no longer a valid choice, so it's written the way the
        # pre-migration database held it.
        User.objects.filter(pk=legacy.pk).update(role="referral_agent")

        migration.agents_to_tourist_profiles(apps, None)

        legacy.refresh_from_db()
        self.assertEqual(legacy.role, "tourist")
        self.assertTrue(legacy.is_referral_agent)
        self.assertTrue(legacy.check_password(PASSWORD))

    # --- activating an existing account -----------------------------------

    def test_tourist_can_activate_the_agent_profile(self):
        self._login_as(self.tourist)
        response = self.client.post(reverse("referral-agent-activate"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "tourist", "is_referral_agent": True, "home": "/agent"})
        self.tourist.refresh_from_db()
        self.assertTrue(self.tourist.is_referral_agent)

    def test_activating_twice_is_harmless(self):
        self._login_as(self.agent)
        response = self.client.post(reverse("referral-agent-activate"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_guides_and_admins_cannot_activate(self):
        for user in (self.guide, self.admin):
            self._login_as(user)
            response = self.client.post(reverse("referral-agent-activate"))
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, user.role)
            user.refresh_from_db()
            self.assertFalse(user.is_referral_agent)

    def test_activation_requires_sign_in(self):
        response = self.client.post(reverse("referral-agent-activate"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- registering a new agent ------------------------------------------

    def test_new_visitor_registers_as_tourist_with_the_profile(self):
        response = self.client.post(
            reverse("referral-agent-register"),
            {"email": "newagent@example.com", "name": "New Agent", "password": STRONG_PASSWORD},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data, {"role": "tourist", "is_referral_agent": True, "home": "/agent"})
        user = User.objects.get(email="newagent@example.com")
        self.assertEqual(user.role, "tourist")
        self.assertTrue(user.is_referral_agent)

    def test_register_with_existing_email_is_refused_and_leaves_that_account_alone(self):
        """Anonymous, so it must never switch the profile on for someone else's account."""
        response = self.client.post(
            reverse("referral-agent-register"),
            {"email": "TRAVELLER@example.com", "name": "Impostor", "password": STRONG_PASSWORD},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Sign in to activate", response.data["detail"])
        self.tourist.refresh_from_db()
        self.assertFalse(self.tourist.is_referral_agent)
        self.assertTrue(self.tourist.check_password(PASSWORD))

    # --- permissions -------------------------------------------------------

    def test_only_agents_can_create_codes(self):
        self._login_as(self.tourist)
        response = self.client.post(reverse("referral-code-list"), {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self._login_as(self.agent)
        response = self.client.post(reverse("referral-code-list"), {})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_agent_can_make_a_booking(self):
        self._login_as(self.agent)
        booking = make_booking(self.agent)
        response = self.client.post(reverse("booking-pay", args=[booking.id]), {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- where they land ---------------------------------------------------

    def test_home_path_rules(self):
        self.assertEqual(self.tourist.home_path, "/account")
        self.assertEqual(self.agent.home_path, "/agent")
        self.assertEqual(self.guide.home_path, "/guide")
        self.assertEqual(self.admin.home_path, "/admin")
        make_booking(self.agent)
        self.assertEqual(self.agent.home_path, "/account")

    def test_me_reports_the_profile_and_home(self):
        self._login_as(self.agent)
        response = self.client.get(reverse("me"))
        self.assertTrue(response.data["is_referral_agent"])
        self.assertEqual(response.data["home"], "/agent")


class SelfReferralTests(APITestCase):
    def setUp(self):
        self.agent = User.objects.create_user(
            email="agent@example.com", password=PASSWORD, role="tourist", is_referral_agent=True
        )
        self.other_agent = User.objects.create_user(
            email="other-agent@example.com", password=PASSWORD, role="tourist", is_referral_agent=True
        )
        self.own_code = ReferralCode.objects.create(agent=self.agent)
        self.friends_code = ReferralCode.objects.create(agent=self.other_agent)
        self.client.post(reverse("login"), {"email": self.agent.email, "password": PASSWORD})

    def test_validation_rejects_your_own_code(self):
        response = self.client.post(reverse("referral-code-validate"), {"code": self.own_code.code})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "You can't use your own referral code.")

    def test_validation_accepts_someone_elses_code(self):
        response = self.client.post(reverse("referral-code-validate"), {"code": self.friends_code.code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_paying_with_your_own_code_records_no_commission(self):
        booking = make_booking(self.agent)
        response = self.client.post(
            reverse("booking-pay", args=[booking.id]),
            {"amount": 5100, "trip_total": 17000, "referral_code": self.own_code.code},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ReferralRedemption.objects.filter(booking=booking).exists())
        self.own_code.refresh_from_db()
        self.assertFalse(self.own_code.is_used)

    def test_paying_with_someone_elses_code_records_their_commission(self):
        booking = make_booking(self.agent)
        self.client.post(
            reverse("booking-pay", args=[booking.id]),
            {"amount": 5100, "trip_total": 17000, "referral_code": self.friends_code.code},
        )
        redemption = ReferralRedemption.objects.get(booking=booking)
        self.assertEqual(redemption.code, self.friends_code)
