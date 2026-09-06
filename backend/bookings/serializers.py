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


class QuoteLineItemInputSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=200)
    cost = serializers.IntegerField(min_value=0)
    markup_percent = serializers.IntegerField(min_value=0)


class QuoteUpdateSerializer(serializers.Serializer):
    line_items = QuoteLineItemInputSerializer(many=True)

    def update(self, instance, validated_data):
        instance.line_items.all().delete()
        for order, item in enumerate(validated_data["line_items"]):
            QuoteLineItem.objects.create(booking=instance, order=order, **item)
        return instance


class BookingNoteInputSerializer(serializers.Serializer):
    text = serializers.CharField(allow_blank=False)
