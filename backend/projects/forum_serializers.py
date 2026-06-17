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
        fields = ['id', 'author', 'content', 'mention_ids', 'project', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_mention_ids(self, obj):
        return list(obj.mentions.values_list('id', flat=True))


class ForumPostCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer — accepts content text and optional project_id.
    Auto-parses @Name mentions into user IDs.
    """
    project_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model  = ForumPost
        fields = ['content', 'project_id']

    def create(self, validated_data):
        request = self.context.get('request')
        project_id = validated_data.pop('project_id', None)

        post = ForumPost.objects.create(
            author=request.user,
            project_id=project_id,
            content=validated_data['content'],
        )

        # Parse @mentions from the content text.
        # Match @FirstName LastName or @FirstName (handles multi-word names)
        content = validated_data.get('content', '')
        mention_pattern = re.compile(r'@([\w]+(?:\s[\w]+)?)')
        mentioned_names = mention_pattern.findall(content)

        if mentioned_names:
            # Limit mention resolution to project members if project-scoped
            user_qs = User.objects.all()
            if project_id:
                from .models import ProjectMember
                member_ids = ProjectMember.objects.filter(
                    project_id=project_id
                ).values_list('user_id', flat=True)
                user_qs = user_qs.filter(id__in=member_ids)

            for name in mentioned_names:
                name = name.strip()
                user = user_qs.filter(name__iexact=name).first()
                if user and user != request.user:
                    post.mentions.add(user)

        return post
