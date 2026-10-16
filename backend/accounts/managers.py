from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, name="", role=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        # self.model is the User class this manager is attached to — referenced
        # rather than a "tourist" literal so this can't drift from
        # User.ROLE_CHOICES. Can't use it as the parameter's default directly
        # (self isn't available until the function is called), hence the
        # None-and-substitute here instead.
        if role is None:
            role = self.model.ROLE_TOURIST
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def get_by_natural_key(self, username):
        """Look a user up by email for sign-in, ignoring case.

        normalize_email() only lower-cases the domain, so someone who registered as
        Jane@example.com couldn't sign in by typing jane@example.com. Registration already
        refuses an address that differs from an existing one only by case, so the
        case-insensitive match is normally unique; if legacy rows ever make it ambiguous,
        the exact spelling is required.
        """
        try:
            return self.get(**{self.model.USERNAME_FIELD: username})
        except self.model.DoesNotExist:
            try:
                return self.get(**{f"{self.model.USERNAME_FIELD}__iexact": username})
            except self.model.MultipleObjectsReturned:
                raise self.model.DoesNotExist

    def create_superuser(self, email, password=None, name="", **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields["role"] = self.model.ROLE_ADMIN
        return self.create_user(email, password=password, name=name, **extra_fields)
