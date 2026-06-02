from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    # This tells Django how to create users
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)  # lowercases the domain
        user = self.model(email=email, **extra_fields)
        user.set_password(password)          # hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # Our custom user model — email is the login field
    email      = models.EmailField(unique=True)
    name       = models.CharField(max_length=150, blank=True)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'   # login with email
    REQUIRED_FIELDS = ['name']  # asked when running createsuperuser

    def __str__(self):
        return self.email