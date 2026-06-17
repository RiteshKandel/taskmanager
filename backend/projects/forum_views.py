from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.contrib.auth import get_user_model

from .forum_models import ForumPost
from .forum_serializers import ForumPostSerializer, ForumPostCreateSerializer
from .models import ProjectMember

User = get_user_model()


class ForumPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


class ForumPostViewSet(viewsets.ModelViewSet):
    """
    GET  /api/forum/          — paginated list, newest first
    POST /api/forum/          — create a post (auto-parses @mentions)
    DELETE /api/forum/{id}/   — delete own post only
    """
    permission_classes = [IsAuthenticated]
    pagination_class   = ForumPagination
    http_method_names  = ['get', 'post', 'delete']

    def get_queryset(self):
        return ForumPost.objects.select_related('author').prefetch_related('mentions').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return ForumPostCreateSerializer
        return ForumPostSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        # Return the full read serializer for the response
        return Response(
            ForumPostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response(
                {'error': 'You can only delete your own posts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MemberProjectMatrixView(APIView):
    """
    GET /api/member-matrix/
    Returns all users who share at least one project with the current user,
    along with the projects they are assigned to (that the current user can see).

    Response: [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "...",
            "projects": [
                {"id": 5, "title": "Website Redesign", "color": "#4F46E5", "role": "editor"}
            ]
        },
        ...
    ]
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all projects the current user is part of
        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list('project_id', flat=True)

        # Get all members of those projects (including current user)
        memberships = ProjectMember.objects.filter(
            project_id__in=my_project_ids
        ).select_related('user', 'project').order_by('user__name')

        # Group by user
        user_map = {}
        for m in memberships:
            uid = m.user_id
            if uid not in user_map:
                # Build avatar_url the same way the UserSerializer does
                avatar_url = None
                if m.user.avatar:
                    avatar_url = request.build_absolute_uri(m.user.avatar.url)
                    if avatar_url.startswith('http://'):
                        avatar_url = 'https://' + avatar_url[7:]

                user_map[uid] = {
                    'id':         uid,
                    'name':       m.user.name,
                    'email':      m.user.email,
                    'avatar_url': avatar_url,
                    'projects':   [],
                }
            user_map[uid]['projects'].append({
                'id':    m.project_id,
                'title': m.project.title,
                'color': m.project.color,
                'role':  m.role,
            })

        return Response(list(user_map.values()))
