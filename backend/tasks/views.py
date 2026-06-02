from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Task
from .serializers import TaskListSerializer, TaskDetailSerializer


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['project', 'status', 'priority', 'is_done', 'parent']
    search_fields      = ['title', 'description']
    ordering_fields    = ['position', 'due_date', 'priority', 'created_at']

    def get_queryset(self):
        user = self.request.user
        from django.db import models as m
        return Task.objects.filter(
            m.Q(project__owner=user) | m.Q(project__members=user)
        ).distinct().select_related('created_by', 'project'
        ).prefetch_related('assignees', 'labels', 'subtasks')

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer

    def check_edit_permission(self, project):
        """Raises 403 if the current user cannot edit tasks in this project."""
        if not project.can_edit(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need editor access or higher to modify tasks.')

    def perform_create(self, serializer):
        project  = serializer.validated_data['project']
        self.check_edit_permission(project)
        last_pos = Task.objects.filter(project=project).count()
        serializer.save(created_by=self.request.user, position=last_pos)

    def perform_update(self, serializer):
        self.check_edit_permission(serializer.instance.project)
        serializer.save()

    def perform_destroy(self, instance):
        if not instance.project.can_manage(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need admin access to delete tasks.')
        instance.delete()

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Accepts a list of {id, status?, position?} objects.
        Updates status and position for multiple tasks in one request (used after drag-and-drop).
        """
        updates = request.data
        if not isinstance(updates, list):
            return Response({'error': 'Expected a list'}, status=status.HTTP_400_BAD_REQUEST)

        for item in updates:
            task_id = item.get('id')
            try:
                task = self.get_queryset().get(id=task_id)
                self.check_edit_permission(task.project)
                if 'status' in item:
                    task.status  = item['status']
                    task.is_done = item['status'] == 'done'
                if 'position' in item:
                    task.position = item['position']
                task.save()
            except Task.DoesNotExist:
                pass

        return Response({'updated': len(updates)})