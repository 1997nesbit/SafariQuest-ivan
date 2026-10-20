from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, TripMilestone
from guides.models import Guide
from safaris.models import ItineraryDay, SafariPackage

User = get_user_model()

# Booking dates must not be in the past, so tests book a couple of months ahead of
# whenever they run rather than on a fixed date that eventually expires.
TRIP_START = date.today() + timedelta(days=60)


def trip_day(offset):
    return (TRIP_START + timedelta(days=offset)).isoformat()


def make_safari_with_itinerary():
    safari = SafariPackage.objects.create(
        slug="migration-quest",
        title="7-Day Great Migration Quest",
        image="https://example.com/image.jpg",
        image_alt="Migration",
        rating="4.9",
        days=3,
        accommodation="Luxury tented camp",
        price=17000,
        destination="Serengeti National Park",
        overview="A migration safari.",
    )
    ItineraryDay.objects.create(safari=safari, day=1, title="Arrival", description="Arrive and settle in.")
    ItineraryDay.objects.create(safari=safari, day=2, title="Game Drive", description="Full day game drive.")
    ItineraryDay.objects.create(safari=safari, day=3, title="Departure", description="Transfer to the airport.")
    return safari


class MilestoneGenerationTests(APITestCase):
    def setUp(self):
        self.url = reverse("booking-list")
        self.safari = make_safari_with_itinerary()

    def test_booking_creation_snapshots_itinerary_as_milestones(self):
        response = self.client.post(
            self.url,
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "safari": self.safari.slug,
                "start_date": trip_day(0),
                "end_date": trip_day(2),
                "guests": 2,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        milestones = response.data["milestones"]
        self.assertEqual(len(milestones), 3)
        self.assertEqual(milestones[0]["title"], "Arrival")
        self.assertEqual(milestones[0]["status"], "current")
        self.assertEqual(milestones[1]["status"], "upcoming")
        self.assertEqual(milestones[2]["status"], "upcoming")

    def test_booking_with_no_itinerary_gets_no_milestones(self):
        bare_safari = SafariPackage.objects.create(
            slug="no-itinerary",
            title="Bare Package",
            image="https://example.com/image.jpg",
            image_alt="Bare",
            rating="4.0",
            days=1,
            accommodation="Camp",
            price=100,
            destination="Nowhere",
            overview="No days configured.",
        )
        response = self.client.post(
            self.url,
            {
                "name": "Jane Doe",
                "email": "jane2@example.com",
                "safari": bare_safari.slug,
                "start_date": trip_day(0),
                "end_date": trip_day(1),
                "guests": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["milestones"], [])


class MilestoneCompleteTests(APITestCase):
    def setUp(self):
        self.safari = make_safari_with_itinerary()
        self.customer = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.guide_user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide")
        self.guide = Guide.objects.create(name="Juma", role="Senior Guide", user=self.guide_user)
        self.other_guide_user = User.objects.create_user(email="other@example.com", password="pw12345", role="guide")
        Guide.objects.create(name="Other", role="Senior Guide", user=self.other_guide_user)
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")

        self.booking = Booking.objects.create(
            customer=self.customer,
            safari=self.safari,
            assigned_guide=self.guide,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 3),
            guests=2,
        )
        days = list(self.safari.itinerary.all())
        self.m1 = TripMilestone.objects.create(
            booking=self.booking, order=0, day=1, title="Arrival", status=TripMilestone.STATUS_CURRENT
        )
        self.m2 = TripMilestone.objects.create(
            booking=self.booking, order=1, day=2, title="Game Drive", status=TripMilestone.STATUS_UPCOMING
        )
        self.m3 = TripMilestone.objects.create(
            booking=self.booking, order=2, day=3, title="Departure", status=TripMilestone.STATUS_UPCOMING
        )
        self.complete_url = reverse("booking-milestone-complete", args=[self.booking.id, self.m1.id])
        self.milestones_url = reverse("booking-milestones", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_tourist_can_read_milestones(self):
        self._login_as(self.customer)
        response = self.client.get(self.milestones_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_tourist_cannot_complete_milestone(self):
        self._login_as(self.customer)
        response = self.client.post(self.complete_url, {"note": "Nice trip"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unassigned_guide_cannot_complete(self):
        self._login_as(self.other_guide_user)
        response = self.client.post(self.complete_url, {})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assigned_guide_completes_current_and_advances_next(self):
        self._login_as(self.guide_user)
        response = self.client.post(self.complete_url, {"note": "Smooth arrival"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.m1.refresh_from_db()
        self.m2.refresh_from_db()
        self.assertEqual(self.m1.status, TripMilestone.STATUS_COMPLETED)
        self.assertEqual(self.m1.note, "Smooth arrival")
        self.assertIsNotNone(self.m1.completed_at)
        self.assertEqual(self.m2.status, TripMilestone.STATUS_CURRENT)

    def test_cannot_complete_a_non_current_milestone(self):
        self._login_as(self.guide_user)
        url = reverse("booking-milestone-complete", args=[self.booking.id, self.m2.id])
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_completing_last_milestone_leaves_nothing_current(self):
        self._login_as(self.guide_user)
        self.client.post(self.complete_url, {})
        url2 = reverse("booking-milestone-complete", args=[self.booking.id, self.m2.id])
        self.client.post(url2, {})
        url3 = reverse("booking-milestone-complete", args=[self.booking.id, self.m3.id])
        response = self.client.post(url3, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.m3.refresh_from_db()
        self.assertEqual(self.m3.status, TripMilestone.STATUS_COMPLETED)

    def test_admin_can_complete_milestone(self):
        self._login_as(self.admin)
        response = self.client.post(self.complete_url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
