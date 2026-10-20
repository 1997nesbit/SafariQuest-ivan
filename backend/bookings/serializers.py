from django.conf import settings
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import serializers

from config.mail import send_notification
from region_safaris.models import RegionSafari
from safaris.models import SafariPackage

from .models import Booking, BookingNote, Invoice, QuoteLineItem, Review, TripMilestone

User = get_user_model()


class BookingListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name")
    customer_email = serializers.EmailField(source="customer.email")
    package_title = serializers.CharField(read_only=True)
    region = serializers.CharField(source="region_name", read_only=True)
    assigned_guide_name = serializers.CharField(source="assigned_guide.name", default=None)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer_name",
            "customer_email",
            "package_title",
            "region",
            "start_date",
            "end_date",
            "guests",
            "stage",
            "assigned_guide",
            "assigned_guide_name",
            "subtotal",
        ]

    def get_subtotal(self, obj):
        return obj.subtotal


class QuoteLineItemSerializer(serializers.ModelSerializer):
    quote_price = serializers.SerializerMethodField()

    class Meta:
        model = QuoteLineItem
        fields = ["label", "quantity", "unit_price", "quote_price"]

    def get_quote_price(self, obj):
        return obj.quote_price


class BookingNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", default="Unknown")

    class Meta:
        model = BookingNote
        fields = ["id", "author_name", "text", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source="booking.id", read_only=True)
    customer_name = serializers.CharField(source="booking.customer.name", read_only=True)
    customer_email = serializers.EmailField(source="booking.customer.email", read_only=True)
    package_title = serializers.CharField(source="booking.package_title", read_only=True)
    status = serializers.CharField(source="effective_status", read_only=True)
    remaining_balance = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "booking_id",
            "customer_name",
            "customer_email",
            "package_title",
            "amount",
            "trip_total",
            "remaining_balance",
            "status",
            "issued_date",
            "due_date",
        ]


class InvoiceDetailSerializer(InvoiceSerializer):
    line_items = QuoteLineItemSerializer(source="booking.line_items", many=True, read_only=True)
    start_date = serializers.DateField(source="booking.start_date", read_only=True)
    end_date = serializers.DateField(source="booking.end_date", read_only=True)
    guests = serializers.IntegerField(source="booking.guests", read_only=True)

    class Meta(InvoiceSerializer.Meta):
        fields = InvoiceSerializer.Meta.fields + ["line_items", "start_date", "end_date", "guests"]


class InvoiceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ["status"]

    def validate_status(self, value):
        if value not in (Invoice.STATUS_UNPAID, Invoice.STATUS_DEPOSIT_PAID, Invoice.STATUS_PAID):
            raise serializers.ValidationError("Unknown status.")
        return value


class TripMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripMilestone
        fields = ["id", "day", "title", "description", "status", "note", "photo", "completed_at"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["guide_rating", "trip_rating", "testimonial", "created_at"]


class BookingDetailSerializer(BookingListSerializer):
    """What the booking's tourist and assigned guide see. Leaves out `notes`, the admins'
    internal thread — see AdminBookingDetailSerializer, and SupportTicketOwnSerializer for
    the same rule on support tickets."""

    line_items = QuoteLineItemSerializer(many=True, read_only=True)
    milestones = TripMilestoneSerializer(many=True, read_only=True)
    review = ReviewSerializer(read_only=True)

    class Meta(BookingListSerializer.Meta):
        fields = BookingListSerializer.Meta.fields + [
            "children",
            "message",
            "created_at",
            "line_items",
            "milestones",
            "review",
        ]


class AdminBookingDetailSerializer(BookingDetailSerializer):
    notes = BookingNoteSerializer(many=True, read_only=True)

    class Meta(BookingDetailSerializer.Meta):
        fields = BookingDetailSerializer.Meta.fields + ["notes"]


class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["assigned_guide", "stage"]

    def validate_stage(self, value):
        if value == Booking.STAGE_QUOTED:
            raise serializers.ValidationError(
                "Use POST /api/bookings/{id}/quote/send/ to move a booking to the Quoted stage."
            )
        order = Booking.STAGE_ORDER
        if value not in order:
            raise serializers.ValidationError("Unknown stage.")
        current_index = order.index(self.instance.stage)
        target_index = order.index(value)
        if target_index != current_index + 1:
            raise serializers.ValidationError(
                f"Cannot move from '{self.instance.stage}' directly to '{value}'."
            )
        return value


class BookingPaySerializer(serializers.Serializer):
    """Opens a Snippe checkout session for a deposit or balance. No amounts are accepted:
    they're computed server-side (bookings.pricing / the invoice), so a caller can't choose
    their own price. `locale` only picks which language the return page opens in."""

    referral_code = serializers.CharField(required=False, allow_blank=True)
    locale = serializers.ChoiceField(choices=["en", "fr", "de", "pt"], required=False, default="en")


class QuoteLineItemInputSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=200)
    quantity = serializers.IntegerField(min_value=1, default=1)
    unit_price = serializers.IntegerField(min_value=0)


class QuoteUpdateSerializer(serializers.Serializer):
    line_items = QuoteLineItemInputSerializer(many=True)

    def update(self, instance, validated_data):
        # Delete-then-recreate: a failure partway through used to leave a
        # quote with some or none of its line items rather than either the old
        # set or the new one.
        with transaction.atomic():
            instance.line_items.all().delete()
            for order, item in enumerate(validated_data["line_items"]):
                QuoteLineItem.objects.create(booking=instance, order=order, **item)
            # A quote that's already been sent has an invoice; while nothing has been paid
            # against it, it follows the quote, or the customer is billed the old figure.
            new_total = sum(item["quantity"] * item["unit_price"] for item in validated_data["line_items"])
            if new_total:
                Invoice.objects.filter(booking=instance, status=Invoice.STATUS_UNPAID).update(amount=new_total)
        return instance


class BookingNoteInputSerializer(serializers.Serializer):
    text = serializers.CharField(allow_blank=False)


class MilestoneCompleteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.URLField(required=False, allow_blank=True)


class ReviewInputSerializer(serializers.Serializer):
    guide_rating = serializers.IntegerField(min_value=1, max_value=5)
    trip_rating = serializers.IntegerField(min_value=1, max_value=5)
    testimonial = serializers.CharField(required=False, allow_blank=True)


class BookingCreateSerializer(serializers.Serializer):
    """Creates a booking from the public Trip Curator (1.2) or direct checkout (1.3) flow.

    Anonymous submissions attach to an existing unusable-password account (an earlier
    auto-created shell), create a new tourist account, or are rejected if the email already
    belongs to a real registered account (sign-in required — this endpoint never takes over an
    existing account). An anonymous caller is never signed in to the account: the email isn't
    verified, so whoever typed it may not own it. The owner claims it through the set-password
    link sent to that address. Authenticated tourists always book as themselves.
    """

    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    safari = serializers.SlugRelatedField(
        slug_field="slug", queryset=SafariPackage.objects.all(), required=False
    )
    region_safari = serializers.SlugRelatedField(
        slug_field="slug", queryset=RegionSafari.objects.all(), required=False
    )
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    guests = serializers.IntegerField(min_value=1)
    children = serializers.IntegerField(min_value=0, default=0)
    message = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if bool(attrs.get("safari")) == bool(attrs.get("region_safari")):
            raise serializers.ValidationError("Provide exactly one of safari or region_safari.")
        # Today counts (Tanzania time, settings.TIME_ZONE): only trips that would already
        # have started are refused.
        if attrs["start_date"] < timezone.localdate():
            raise serializers.ValidationError({"start_date": "The start date can't be in the past."})
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})
        if attrs["children"] >= attrs["guests"]:
            raise serializers.ValidationError({"children": "At least one guest must be an adult."})
        request = self.context["request"]
        if not request.user.is_authenticated and not attrs.get("email"):
            raise serializers.ValidationError({"email": "This field is required."})
        # A signed-in staff/guide account must not become a booking's
        # customer — BookingViewSet.get_queryset() only scopes bookings to tourist/guide
        # (own)/admin, so any other role's "own" booking would be silently invisible to it
        # afterward (e.g. the /pay/ action 404ing instead of ever finding it).
        if request.user.is_authenticated and request.user.role != User.ROLE_TOURIST:
            raise serializers.ValidationError(
                {"detail": "This account type can't make bookings. Sign out and continue as a tourist to book."}
            )
        return attrs

    def _resolve_customer(self, attrs):
        request = self.context["request"]
        if request.user.is_authenticated:
            return request.user, False

        email = User.objects.normalize_email(attrs["email"])
        name = attrs.get("name", "")
        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            if existing.has_usable_password():
                # A dict passed straight to ValidationError from inside create() (called after
                # is_valid() already passed) skips the as_serializer_error() normalization that
                # validate()-raised errors get for free — the value must be wrapped in a list by
                # hand, or the frontend's array-shaped error parser silently drops the message.
                raise serializers.ValidationError(
                    {"email": ["An account with this email already exists — please sign in first."]}
                )
            return existing, False

        customer = User.objects.create(email=email, name=name, role=User.ROLE_TOURIST)
        customer.set_unusable_password()
        customer.save()
        return customer, True

    def _send_account_created_email(self, user):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        set_password_url = f"{settings.FRONTEND_URL}/set-password?uid={uid}&token={token}"
        send_notification(
            subject="Your SafariQuest account is ready",
            message=(
                f"Hi {user.name or user.email},\n\n"
                "We've created an account for you so you can track your booking. "
                f"Set a password any time you'd like: {set_password_url}"
            ),
            recipient_list=[user.email],
        )

    def _create_milestones(self, booking):
        source = booking.safari if booking.safari_id else booking.region_safari
        days = list(source.itinerary.all())
        TripMilestone.objects.bulk_create(
            TripMilestone(
                booking=booking,
                order=i,
                day=d.day,
                title=d.title,
                description=d.description,
                status=TripMilestone.STATUS_CURRENT if i == 0 else TripMilestone.STATUS_UPCOMING,
            )
            for i, d in enumerate(days)
        )

    def create(self, validated_data):
        # Customer + booking + milestones have to land together — a crash
        # between them used to leave either an account with no booking, or a
        # booking with no itinerary. Mail is sent after commit, deliberately
        # outside the transaction: it is best-effort (see config.mail) and a
        # slow SMTP round trip must not hold the database connection open.
        with transaction.atomic():
            customer, is_new = self._resolve_customer(validated_data)
            booking = Booking.objects.create(
                customer=customer,
                safari=validated_data.get("safari"),
                region_safari=validated_data.get("region_safari"),
                start_date=validated_data["start_date"],
                end_date=validated_data["end_date"],
                guests=validated_data["guests"],
                children=validated_data["children"],
                message=validated_data.get("message", ""),
            )
            self._create_milestones(booking)
        if is_new:
            self._send_account_created_email(customer)
        return booking
