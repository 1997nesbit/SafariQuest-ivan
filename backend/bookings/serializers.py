from rest_framework import serializers

from .models import Booking, BookingNote, QuoteLineItem


class BookingListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name")
    customer_email = serializers.EmailField(source="customer.email")
    package_title = serializers.CharField(source="safari.title")
    region = serializers.CharField(source="safari.destination")
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
        fields = ["label", "cost", "markup_percent", "quote_price"]

    def get_quote_price(self, obj):
        return obj.quote_price


class BookingNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", default="Unknown")

    class Meta:
        model = BookingNote
        fields = ["id", "author_name", "text", "created_at"]


class BookingDetailSerializer(BookingListSerializer):
    line_items = QuoteLineItemSerializer(many=True, read_only=True)
    notes = BookingNoteSerializer(many=True, read_only=True)

    class Meta(BookingListSerializer.Meta):
        fields = BookingListSerializer.Meta.fields + ["message", "created_at", "line_items", "notes"]
