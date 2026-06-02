from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()  # always use this instead of importing User directly


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
        return data

    def create(self, validated_data):
        validated_data.pop('password2')  # remove before saving
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    # Used to return user info — never includes password
    class Meta:
        model  = User
        fields = ['id', 'email', 'name', 'avatar', 'created_at']
        read_only_fields = ['id', 'created_at']
 