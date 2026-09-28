from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


User = get_user_model()


class UserInviteSerializer(serializers.ModelSerializer):
    """Invites another Administrator. Tourists self-register (RegisterSerializer) and Guides are
    created directly with an account via guides.GuideCreateSerializer — this is the only remaining
    invite path, so the role is always "admin"."""

    class Meta:
        model = User
        fields = ["email", "name"]

    def create(self, validated_data):
        user = User(email=validated_data["email"], name=validated_data.get("name", ""), role=User.ROLE_ADMIN)
        user.set_unusable_password()
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "role", "is_active"]


class UserActiveUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_active"]


class CustomerSerializer(serializers.ModelSerializer):
    trip_count = serializers.SerializerMethodField()
    total_spend = serializers.SerializerMethodField()
    booking_ids = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "email", "date_joined", "is_referral_agent", "trip_count", "total_spend", "booking_ids"]

    def get_trip_count(self, obj):
        return len(obj.bookings.all())

    def get_total_spend(self, obj):
        return sum(b.subtotal for b in obj.bookings.all())

    def get_booking_ids(self, obj):
        return [b.id for b in obj.bookings.all()]


class CustomerDetailSerializer(CustomerSerializer):
    bookings = serializers.SerializerMethodField()
    invoices = serializers.SerializerMethodField()

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ["bookings", "invoices"]

    def get_bookings(self, obj):
        from bookings.serializers import BookingListSerializer

        return BookingListSerializer(obj.bookings.all(), many=True).data

    def get_invoices(self, obj):
        from bookings.serializers import InvoiceSerializer

        invoices = [b.invoice for b in obj.bookings.all() if hasattr(b, "invoice")]
        return InvoiceSerializer(invoices, many=True).data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def validate_email(self, value):
        value = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data.get("name", ""),
            role=User.ROLE_TOURIST,
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.has_usable_password() or not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class SetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        try:
            pk = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=pk)
        except (ValueError, TypeError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid or expired link.")
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("Invalid or expired link.")
        attrs["user"] = user
        return attrs
