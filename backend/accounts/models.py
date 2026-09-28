from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_TOURIST = "tourist"
    ROLE_GUIDE = "guide"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = [
        (ROLE_TOURIST, "Tourist"),
        (ROLE_GUIDE, "Guide"),
        (ROLE_ADMIN, "Administrator"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_TOURIST)
    # Referral agent is a profile a tourist account switches on, not a separate kind of
    # account: one login can both book trips and refer others, and the two sets of data
    # stay apart (bookings via Booking.customer, codes via ReferralCode.agent). Only
    # tourists can hold it — staff shouldn't earn commission on bookings they handle.
    is_referral_agent = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    @property
    def home_path(self) -> str:
        """The dashboard this user lands on after signing in.

        Agents who have never booked (hotels, travel agents — people who joined only to
        refer) go straight to the agent dashboard; anyone with trips sees those first and
        switches to the agent dashboard from there.
        """
        if self.role == self.ROLE_ADMIN:
            return "/admin"
        if self.role == self.ROLE_GUIDE:
            return "/guide"
        if self.is_referral_agent and not self.bookings.exists():
            return "/agent"
        return "/account"
