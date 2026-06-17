from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Project, ProjectMember, Label
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ProjectTreeSerializer, LabelSerializer, ProjectMemberSerializer,
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
        root_id = request.query_params.get('root_id')

        all_projects = list(qs)
        
        if root_id:
            try:
                root_id = int(root_id)
                descendant_ids = {root_id}
                queue = [root_id]
                while queue:
                    current = queue.pop(0)
                    children = [p.pk for p in all_projects if p.parent_id == current]
                    descendant_ids.update(children)
                    queue.extend(children)
                
                all_projects = [p for p in all_projects if p.pk in descendant_ids]
            except ValueError:
                pass

        if search:
            all_projects = [p for p in all_projects if search.lower() in p.title.lower()]

        def build_path(project):
            parts = [project.title]
            p = project.parent
            while p:
                parts.insert(0, p.title)
                p = p.parent
            return ' / '.join(parts)

        data = [
            {'id': p.pk, 'title': p.title, 'path': build_path(p), 'color': p.color}
            for p in all_projects
        ]
        return Response(data)

    @action(detail=True, methods=['get', 'patch'], url_path='my-settings',
            permission_classes=[IsAuthenticated])
    def my_settings(self, request, pk=None):
        """
        GET/PATCH /api/projects/{id}/my-settings/
        Self-service: every member can read and update their OWN membership row.
        """
        project = self.get_object()
        try:
            membership = ProjectMember.objects.get(project=project, user=request.user)
        except ProjectMember.DoesNotExist:
            return Response({'error': 'Not a member of this project.'}, status=404)

        if request.method == 'PATCH':
            if 'notifications_muted' in request.data:
                membership.notifications_muted = bool(request.data['notifications_muted'])
                membership.save(update_fields=['notifications_muted'])

        return Response({
            'notifications_muted': membership.notifications_muted,
            'role': membership.role,
        })

    @action(detail=True, methods=['post'], url_path='transfer-ownership',
            permission_classes=[IsAuthenticated])
    def transfer_ownership(self, request, pk=None):
        """
        POST /api/projects/{id}/transfer-ownership/  { "new_owner_id": 7 }
        Only the current owner can call this.
        """
        project = self.get_object()

        if project.owner_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the current owner can transfer ownership.')

        new_owner_id = request.data.get('new_owner_id')
        try:
            new_membership = ProjectMember.objects.get(project=project, user_id=new_owner_id)
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'That user is not a member of this project.'},
                status=400
            )

        old_owner = project.owner

        # Swap the actual owner field
        project.owner = new_membership.user
        project.save(update_fields=['owner'])

        # New owner's membership row becomes role=OWNER
        new_membership.role = ProjectMember.Role.OWNER
        new_membership.save(update_fields=['role'])

        # Old owner is demoted to admin — they keep access, just not ownership
        ProjectMember.objects.filter(
            project=project, user=old_owner
        ).update(role=ProjectMember.Role.ADMIN)

        return Response(
            ProjectDetailSerializer(project, context={'request': request}).data
        )


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
