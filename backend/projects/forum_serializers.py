import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from .forum_models import ForumPost

User = get_user_model()


class ForumPostSerializer(serializers.ModelSerializer):
    """Read serializer — returns full author info and mention user IDs."""
    author      = UserSerializer(read_only=True)
    mention_ids = serializers.SerializerMethodField()

    class Meta:
        model  = ForumPost
        fields = ['id', 'author', 'content', 'mention_ids', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_mention_ids(self, obj):
        return list(obj.mentions.values_list('id', flat=True))


class ForumPostCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer — accepts content text, auto-parses @Name mentions
    into user IDs by matching against all registered user names.
    """
    class Meta:
        model  = ForumPost
        fields = ['content']

    def create(self, validated_data):
        request = self.context.get('request')
        post = ForumPost.objects.create(
            author=request.user,
            **validated_data
        )

        # Parse @mentions from the content text.
        # Match @FirstName LastName or @FirstName (handles multi-word names)
        content = validated_data.get('content', '')
        mention_pattern = re.compile(r'@([\w]+(?:\s[\w]+)?)')
        mentioned_names = mention_pattern.findall(content)

        if mentioned_names:
            # Try to resolve each mentioned name to a user
            for name in mentioned_names:
                name = name.strip()
                # Try exact name match first, then case-insensitive
                user = User.objects.filter(name__iexact=name).first()
                if user and user != request.user:
                    post.mentions.add(user)

        return post
