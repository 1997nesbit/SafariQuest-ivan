from django.contrib.auth import authenticate, get_user_model
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
    class Meta:
        model = User
        fields = ["email", "name", "role"]

    def validate_role(self, value):
        if value not in ("sales", "operations"):
            raise serializers.ValidationError("Invitable roles are 'sales' or 'operations'.")
        return value

    def create(self, validated_data):
        user = User(email=validated_data["email"], name=validated_data.get("name", ""), role=validated_data["role"])
        user.set_unusable_password()
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]
