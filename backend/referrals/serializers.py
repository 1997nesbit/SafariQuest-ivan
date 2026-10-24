from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from .models import MAX_CODE_EXPIRY_DAYS, MIN_CODE_EXPIRY_DAYS, ReferralCode, ReferralRedemption, ReferralSettings

User = get_user_model()


class ReferralAgentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def validate_email(self, value):
        value = User.objects.normalize_email(value)
        # Never attach an agent profile to an existing account from here: this endpoint is
        # anonymous, so doing so would let anyone who knows an email address change that
        # person's account. Existing users sign in and use the activate endpoint instead.
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "You already have a Pande account with this email. Sign in to activate your agent profile."
            )
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
            is_referral_agent=True,
        )


class ReferralRedemptionSummarySerializer(serializers.ModelSerializer):
    bookingId = serializers.IntegerField(source="booking_id")
    # Commission is in the booking's currency (TZS or USD).
    currency = serializers.CharField(source="booking.currency", read_only=True)

    class Meta:
        model = ReferralRedemption
        fields = ["bookingId", "commission_amount", "currency", "commission_status", "created_at"]


class ReferralCodeSerializer(serializers.ModelSerializer):
    redemption = serializers.SerializerMethodField()

    class Meta:
        model = ReferralCode
        fields = [
            "id",
            "code",
            "contact_name",
            "status",
            "created_at",
            "expires_at",
            "used_at",
            "redemption",
        ]
        read_only_fields = ["id", "code", "status", "created_at", "expires_at", "used_at"]

    def get_redemption(self, obj):
        # Read through the prefetched list: .first() would add an ORDER BY and so
        # bypass the prefetch, costing one query per code.
        redemptions = list(obj.redemptions.all())
        if not redemptions:
            return None
        return ReferralRedemptionSummarySerializer(redemptions[0]).data


class ReferralCodeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralCode
        fields = ["contact_name"]

    def create(self, validated_data):
        agent = self.context["request"].user
        return ReferralCode.objects.create(agent=agent, **validated_data)


class ReferralCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        value = value.strip().upper()
        try:
            referral_code = ReferralCode.objects.get(code=value)
        except ReferralCode.DoesNotExist:
            raise serializers.ValidationError("This referral code doesn't exist.")
        if referral_code.is_used:
            raise serializers.ValidationError("This referral code has already been used.")
        if referral_code.is_expired:
            raise serializers.ValidationError("This referral code has expired.")
        # One account can now both book and refer; using your own code would pay you
        # commission on your own discounted trip.
        request = self.context.get("request")
        if request and referral_code.agent_id == request.user.id:
            raise serializers.ValidationError("You can't use your own referral code.")
        return referral_code


class ReferralSettingsPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralSettings
        fields = ["discount_percent", "commission_percent", "code_expiry_days"]


class ReferralSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralSettings
        fields = ["discount_percent", "commission_percent", "code_expiry_days"]

    @staticmethod
    def _validate_percent(value):
        # The column holds up to 999.99 and negatives, so a slipped digit (50 for 5.0)
        # would otherwise be saved as a 50% commission.
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Enter a percentage between 0 and 100.")
        return value

    def validate_discount_percent(self, value):
        return self._validate_percent(value)

    def validate_commission_percent(self, value):
        return self._validate_percent(value)

    def validate_code_expiry_days(self, value):
        if not MIN_CODE_EXPIRY_DAYS <= value <= MAX_CODE_EXPIRY_DAYS:
            raise serializers.ValidationError(
                f"Expiry must be between {MIN_CODE_EXPIRY_DAYS} and {MAX_CODE_EXPIRY_DAYS} days."
            )
        return value


class AdminReferralRedemptionSerializer(serializers.ModelSerializer):
    agentName = serializers.CharField(source="code.agent.name")
    agentEmail = serializers.CharField(source="code.agent.email")
    code = serializers.CharField(source="code.code")
    bookingId = serializers.IntegerField(source="booking_id")
    customerName = serializers.CharField(source="booking.customer.name")
    customerEmail = serializers.CharField(source="booking.customer.email")
    currency = serializers.CharField(source="booking.currency", read_only=True)

    class Meta:
        model = ReferralRedemption
        fields = [
            "id",
            "agentName",
            "agentEmail",
            "code",
            "bookingId",
            "customerName",
            "customerEmail",
            "trip_total",
            "discount_percent",
            "commission_percent",
            "commission_amount",
            "currency",
            "commission_status",
            "created_at",
        ]
