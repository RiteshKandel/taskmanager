from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import models
from django.db.models import Q
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from collections import defaultdict

from .models import Project, ProjectMember, Label, ProjectMessage
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ProjectTreeSerializer, LabelSerializer, ProjectMemberSerializer,
    ProjectMessageSerializer,
)
from .permissions import IsProjectEditor, IsProjectAdmin, IsProjectOwner

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields   = ['title', 'description']
    ordering_fields = ['position', 'created_at', 'title']

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(
            models.Q(owner=user) | models.Q(members=user)
        ).distinct().prefetch_related('projectmember_set__user')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'create', 'tree', 'flat']:
            perms = [IsAuthenticated]
        elif self.action == 'destroy':
            perms = [IsAuthenticated, IsProjectOwner]
        elif self.action in ['update', 'partial_update']:
            perms = [IsAuthenticated, IsProjectAdmin]
        else:
            perms = [IsAuthenticated, IsProjectEditor]
        return [p() for p in perms]

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Create an owner membership row so the creator appears in the members list.
        ProjectMember.objects.create(
            project=project,
            user=self.request.user,
            role=ProjectMember.Role.OWNER
        )

    @action(detail=True, methods=['get'], url_path='my-role')
    def my_role(self, request, pk=None):
        """Returns the current user's role in this project."""
        project = self.get_object()
        role = project.get_member_role(request.user)
        return Response({'role': role})

    @action(detail=False, methods=['get'], url_path='tree')
    def tree(self, request):
        """
        Returns root-level projects (parent=None) with subprojects nested inside them.
        GET /api/projects/tree/
        """
        user = request.user
        all_projects = Project.objects.filter(
            models.Q(owner=user) | models.Q(members=user)
        ).distinct().prefetch_related(
            'projectmember_set__user'
        ).order_by('position', 'created_at')

        root_projects = [p for p in all_projects if p.parent_id is None]

        serializer = ProjectTreeSerializer(
            root_projects,
            many=True,
            context={'request': request, 'all_projects': list(all_projects)}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='flat')
    def flat(self, request):
        """
        Flat list of all projects with a breadcrumb path string.
        Used by the parent project search dropdown.
        GET /api/projects/flat/?search=design
        """
        user = request.user
        qs = Project.objects.filter(
            models.Q(owner=user) | models.Q(members=user)
        ).distinct().select_related('parent', 'parent__parent')

        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(title__icontains=search)

        def build_path(project):
            parts = [project.title]
            p = project.parent
            while p:
                parts.insert(0, p.title)
                p = p.parent
            return ' / '.join(parts)

        data = [
            {'id': p.pk, 'title': p.title, 'path': build_path(p), 'color': p.color}
            for p in qs
        ]
        return Response(data)


class MemberViewSet(viewsets.ModelViewSet):
    """
    Nested under /api/projects/{project_pk}/members/.
    Handles listing, adding, role changes, and removal of members.
    """
    serializer_class   = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'post', 'patch', 'delete']

    def get_project(self):
        project = Project.objects.get(pk=self.kwargs['project_pk'])
        if not project.can_view(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You are not a member of this project.')
        return project

    def get_queryset(self):
        return ProjectMember.objects.filter(
            project=self.get_project()
        ).select_related('user')

    def create(self, request, *args, **kwargs):
        project = self.get_project()
        if not project.can_manage(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need admin access to add members.')

        serializer = self.get_serializer(
            data=request.data,
            context={'project': project, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        member = serializer.save(project=project)
        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        project = self.get_project()
        if not project.can_manage(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need admin access to change roles.')

        member = self.get_object()
        if member.role == ProjectMember.Role.OWNER:
            return Response({'error': "Cannot change the owner's role."}, status=status.HTTP_400_BAD_REQUEST)

        new_role = request.data.get('role')
        if new_role not in [r[0] for r in ProjectMember.Role.choices]:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

        member.role = new_role
        member.save()
        return Response(ProjectMemberSerializer(member).data)

    def destroy(self, request, *args, **kwargs):
        project = self.get_project()
        if not project.can_manage(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need admin access to remove members.')

        member = self.get_object()
        if member.role == ProjectMember.Role.OWNER:
            return Response({'error': 'Cannot remove the project owner.'}, status=status.HTTP_400_BAD_REQUEST)

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LabelViewSet(viewsets.ModelViewSet):
    serializer_class   = LabelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Label.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProjectMessageViewSet(viewsets.ModelViewSet):
    """
    Nested under projects: /api/projects/{project_pk}/messages/
    Any member can read and post. Authors can delete their own
    message; admins/owners can delete anyone's.
    """
    serializer_class   = ProjectMessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None          # keep it a simple flat chat log for now
    http_method_names  = ['get', 'post', 'delete']

    def get_project(self):
        project = Project.objects.get(pk=self.kwargs['project_pk'])
        if not project.can_view(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You are not a member of this project.')
        return project

    def get_queryset(self):
        return ProjectMessage.objects.filter(
            project=self.get_project()
        ).select_related('author')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        # NOT gated by can_edit — viewers can chat too, just not edit tasks
        serializer.save(project=self.get_project(), author=self.request.user)

    def perform_destroy(self, instance):
        is_author      = instance.author == self.request.user
        can_moderate   = instance.project.can_manage(self.request.user)
        if not (is_author or can_moderate):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can't delete this message.")
        instance.delete()


class TeamOverviewView(APIView):
    """
    GET /api/team/overview/

    Returns every member the current user shares at least one project with,
    along with which projects they're in and what they're currently working on.
    Scoped only to projects the current user can already see.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Every project the current user can see
        projects = Project.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct().prefetch_related('projectmember_set__user')

        project_ids = [p.id for p in projects]

        # Build: user_id -> { profile info, list of shared projects }
        member_map = {}
        for project in projects:
            for membership in project.projectmember_set.all():
                u = membership.user
                if u.id not in member_map:
                    # Build avatar URL with HTTPS enforcement
                    avatar_url = None
                    if u.avatar:
                        try:
                            avatar_url = request.build_absolute_uri(u.avatar.url)
                            if avatar_url.startswith('http://'):
                                avatar_url = 'https://' + avatar_url[7:]
                        except Exception:
                            avatar_url = None
                    member_map[u.id] = {
                        'id':       u.id,
                        'name':     u.name,
                        'email':    u.email,
                        'avatar':   avatar_url,
                        'projects': [],
                    }
                member_map[u.id]['projects'].append({
                    'id':    project.id,
                    'title': project.title,
                    'color': project.color,
                    'role':  membership.role,
                })

        # Open task counts + up to 3 current task titles scoped to shared projects
        from tasks.models import Task
        open_tasks = (
            Task.objects
            .filter(project_id__in=project_ids, is_done=False)
            .prefetch_related('assignees')
            .only('id', 'title', 'project_id')
        )

        task_counts = defaultdict(int)
        task_titles = defaultdict(list)
        for task in open_tasks:
            for assignee in task.assignees.all():
                if assignee.id in member_map:
                    task_counts[assignee.id] += 1
                    if len(task_titles[assignee.id]) < 3:
                        task_titles[assignee.id].append(task.title)

        members = []
        for uid, data in member_map.items():
            data['open_task_count'] = task_counts.get(uid, 0)
            data['current_tasks']   = task_titles.get(uid, [])
            members.append(data)

        # Most active members first
        members.sort(key=lambda m: m['open_task_count'], reverse=True)

        return Response({'members': members})
