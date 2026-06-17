from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.contrib.auth import get_user_model

from .forum_models import ForumPost
from .forum_serializers import ForumPostSerializer, ForumPostCreateSerializer
from .models import Project, ProjectMember

User = get_user_model()


class ForumPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


class ForumPostViewSet(viewsets.ModelViewSet):
    """
    Global or project-scoped forum.

    GET  /api/forum/                — global forum posts
    GET  /api/forum/?project=5      — project 5's forum (members only)
    POST /api/forum/                — create post (include project_id for project forum)
    DELETE /api/forum/{id}/         — delete own post only
    """
    permission_classes = [IsAuthenticated]
    pagination_class   = ForumPagination
    http_method_names  = ['get', 'post', 'delete']

    def _get_project_id(self):
        """Extract project filter from query params."""
        pid = self.request.query_params.get('project')
        return int(pid) if pid else None

    def _check_project_membership(self, project_id):
        """Returns True if user is a member of the given project."""
        return ProjectMember.objects.filter(
            project_id=project_id, user=self.request.user
        ).exists()

    def get_queryset(self):
        qs = ForumPost.objects.select_related('author').prefetch_related('mentions')
        project_id = self._get_project_id()

        if project_id:
            # Project-scoped: only show if user is a member
            if not self._check_project_membership(project_id):
                return ForumPost.objects.none()
            return qs.filter(project_id=project_id)
        else:
            # Global forum: only posts with project=NULL
            return qs.filter(project__isnull=True)

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

        # If posting to a project forum, verify membership
        project_id = request.data.get('project_id')
        if project_id:
            if not self._check_project_membership(int(project_id)):
                return Response(
                    {'error': 'You are not a member of this project.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        post = serializer.save()
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
    GET /api/member-matrix/             — all shared members across all projects
    GET /api/member-matrix/?project=5   — only members of project 5 + their shared projects
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        project_filter = request.query_params.get('project')

        if project_filter:
            project_id = int(project_filter)
            # Check membership
            if not ProjectMember.objects.filter(project_id=project_id, user=user).exists():
                return Response([])

            # Get member IDs of this project
            member_ids = ProjectMember.objects.filter(
                project_id=project_id
            ).values_list('user_id', flat=True)

            # Get all memberships of these users (across projects they share)
            memberships = ProjectMember.objects.filter(
                user_id__in=member_ids,
                project__in=ProjectMember.objects.filter(
                    user_id__in=member_ids
                ).values_list('project_id', flat=True)
            ).select_related('user', 'project').order_by('user__name')
        else:
            # Global: all projects the current user is part of
            my_project_ids = ProjectMember.objects.filter(
                user=user
            ).values_list('project_id', flat=True)

            memberships = ProjectMember.objects.filter(
                project_id__in=my_project_ids
            ).select_related('user', 'project').order_by('user__name')

        # Group by user
        user_map = {}
        for m in memberships:
            uid = m.user_id
            if uid not in user_map:
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
