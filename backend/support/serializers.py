from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import SupportTicket, SupportTicketNote

User = get_user_model()


class SupportTicketNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", default="Unknown")

    class Meta:
        model = SupportTicketNote
        fields = ["id", "author_name", "text", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source="reporter.name")
    reporter_role = serializers.CharField(source="reporter.role")
    booking_title = serializers.SerializerMethodField()
    notes = SupportTicketNoteSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "reporter_name",
            "reporter_role",
            "booking",
            "booking_title",
            "category",
            "description",
            "photo",
            "status",
            "created_at",
            "notes",
        ]

    def get_booking_title(self, obj):
        return obj.booking.package_title if obj.booking_id else None


class SupportTicketOwnSerializer(serializers.ModelSerializer):
    """What a reporter is allowed to see of their own ticket.

    Deliberately omits `notes`. Those are the Admin Complaints Inbox's internal
    triage thread (7.2), not replies written for the customer — surfacing them
    here would hand internal commentary to the person who complained. Reporter
    name and role are omitted too: on your own ticket they are just your own
    details echoed back.
    """

    booking_title = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "booking",
            "booking_title",
            "category",
            "description",
            "photo",
            "status",
            "created_at",
        ]

    def get_booking_title(self, obj):
        return obj.booking.package_title if obj.booking_id else None


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["booking", "category", "description", "photo"]
        extra_kwargs = {"booking": {"required": False}}

    def validate_booking(self, booking):
        """Only a trip the reporter is on: their own booking, or one they're guiding.

        The field otherwise accepts any booking id, which let anyone file a complaint
        against a stranger's trip (and read its package title back from `mine`).
        """
        if booking is None:
            return booking
        user = self.context["request"].user
        if user.role == User.ROLE_ADMIN or booking.customer_id == user.id:
            return booking
        if booking.assigned_guide_id and booking.assigned_guide.user_id == user.id:
            return booking
        raise serializers.ValidationError("You can only report an issue about one of your own trips.")


class SupportTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["status"]


class SupportTicketNoteInputSerializer(serializers.Serializer):
    text = serializers.CharField(allow_blank=False)
