from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.tests.test_pay import make_booking
from support.models import SupportTicket, SupportTicketNote

User = get_user_model()


class SupportTicketTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("support-ticket-list")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.guide_user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_create(self):
        response = self.client.post(self.list_url, {"description": "Vehicle broke down"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_guide_can_file_a_ticket(self):
        self._login_as(self.guide_user)
        response = self.client.post(
            self.list_url, {"category": "Vehicle Issue", "description": "Flat tire near Seronera"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["reporter_role"], "guide")
        self.assertEqual(response.data["status"], "open")

    def test_tourist_can_file_a_ticket(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, {"description": "Guide was late for pickup"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["reporter_role"], "tourist")

    def test_cannot_file_a_ticket_against_someone_elses_booking(self):
        stranger = User.objects.create_user(email="stranger@example.com", password="pw12345", role="tourist")
        strangers_booking = make_booking(stranger)
        own_booking = make_booking(self.tourist)
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, {"description": "Late pickup", "booking": strangers_booking.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(self.list_url, {"description": "Late pickup", "booking": own_booking.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_non_admin_cannot_list_tickets(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_resolve(self):
        self._login_as(self.tourist)
        create_response = self.client.post(self.list_url, {"description": "Something went wrong"})
        ticket_id = create_response.data["id"]

        self._login_as(self.admin)
        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        # Paginated (config.pagination.StandardPagination): count + results.
        self.assertEqual(list_response.data["count"], 1)

        note_response = self.client.post(
            reverse("support-ticket-notes", args=[ticket_id]), {"text": "Looking into it"}
        )
        self.assertEqual(note_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(note_response.data["notes"]), 1)

        resolve_response = self.client.patch(
            reverse("support-ticket-detail", args=[ticket_id]), {"status": "resolved"}
        )
        self.assertEqual(resolve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(SupportTicket.objects.get(pk=ticket_id).status, "resolved")


class OwnTicketsTests(APITestCase):
    """The /mine projection behind the customer + guide Complaints page.

    AccountComplaints.tsx used to render a hardcoded "No complaints filed"
    because there was no endpoint a non-admin could call, so a customer who had
    filed a complaint was told indefinitely that they had none.
    """

    def setUp(self):
        self.url = reverse("support-ticket-mine")
        self.tourist = User.objects.create_user(email="mine@example.com", password="pw12345", role="tourist")
        self.other = User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.admin = User.objects.create_user(email="admin2@example.com", password="pw12345", role="admin")
        self.mine = SupportTicket.objects.create(reporter=self.tourist, description="Tent had no water")
        self.theirs = SupportTicket.objects.create(reporter=self.other, description="Driver was late")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_is_rejected(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_only_the_requesters_own_tickets(self):
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([t["id"] for t in response.data], [self.mine.id])
        self.assertEqual(response.data[0]["description"], "Tent had no water")

    def test_an_empty_list_is_genuinely_empty(self):
        """The page may only claim "no complaints" when the API says so."""
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_internal_admin_notes_are_not_exposed_to_the_reporter(self):
        """Notes are the Admin inbox's triage thread, not customer-facing replies."""
        SupportTicketNote.objects.create(
            ticket=self.mine, author=self.admin, text="Customer is a repeat complainer, deprioritise"
        )
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("notes", response.data[0])
        self.assertNotIn("deprioritise", str(response.data))

    def test_reporter_still_cannot_read_the_admin_inbox(self):
        self._login_as(self.tourist)
        self.assertEqual(
            self.client.get(reverse("support-ticket-list")).status_code, status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.get(reverse("support-ticket-detail", args=[self.mine.id])).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_reporter_cannot_change_their_own_ticket_status(self):
        self._login_as(self.tourist)
        response = self.client.patch(
            reverse("support-ticket-detail", args=[self.mine.id]), {"status": "resolved"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.mine.refresh_from_db()
        self.assertEqual(self.mine.status, SupportTicket.STATUS_OPEN)
