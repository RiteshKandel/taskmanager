import re
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()  # always use this instead of importing User directly

def validate_password_strength(password):
    if len(password) < 8:
        raise serializers.ValidationError('Password must be at least 8 characters.')
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError('Password must contain an uppercase letter.')
    if not re.search(r'[a-z]', password):
        raise serializers.ValidationError('Password must contain a lowercase letter.')
    if not re.search(r'[0-9]', password):
        raise serializers.ValidationError('Password must contain a number.')
    if not re.search(r'[^A-Za-z0-9]', password):
        raise serializers.ValidationError('Password must contain a special character.')
    return password


class RegisterSerializer(serializers.ModelSerializer):
    # write_only=True means this field is accepted but never returned in responses
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model  = User
        fields = ['email', 'name', 'password', 'password2']

    def validate(self, data):
        # validate() is called automatically — raise here to reject the request
        if data['password'] != data['password2']:
            raise serializers.ValidationError('Passwords do not match')
        validate_password_strength(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('password2')  # remove before saving
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    # Used to return user info — never includes password
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'name', 'avatar', 'avatar_url', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            url = request.build_absolute_uri(obj.avatar.url)
        else:
            url = obj.avatar.url
        # Always serve over HTTPS — Railway sits behind an HTTPS reverse proxy
        # but Django may still see the internal http:// connection
        if url.startswith('http://'):
            url = 'https://' + url[7:]
        return url
 