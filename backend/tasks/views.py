from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import os
from django.conf import settings
from rest_framework.exceptions import ValidationError
from .models import Task, TaskAttachment, TaskComment, ActivityLog
from .serializers import TaskListSerializer, TaskDetailSerializer
from users.serializers import UserSerializer


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

    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, pk=None):
        logs = ActivityLog.objects.filter(task_id=pk).select_related('actor')[:50]
        data = [{
            'id':         l.id,
            'actor_name': l.actor.name,
            'action':     l.get_action_display(),
            'detail':     l.detail,
            'created_at': l.created_at,
        } for l in logs]
        return Response(data)


# ─── Attachment ViewSet ──────────────────────────────────

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url    = serializers.SerializerMethodField()
    file        = serializers.FileField(write_only=True)

    class Meta:
        model  = TaskAttachment
        fields = ['id', 'file', 'filename', 'file_url', 'file_size',
                  'content_type', 'uploaded_by', 'created_at']
        read_only_fields = ['id', 'filename', 'file_size', 'content_type',
                            'uploaded_by', 'created_at']

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class   = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]  # handle file uploads
    http_method_names  = ['get', 'post', 'delete']
    pagination_class   = None  # always scoped to one task — no pagination needed

    def get_queryset(self):
        return TaskAttachment.objects.filter(
            task_id=self.kwargs['task_pk']
        ).select_related('uploaded_by')

    def perform_create(self, serializer):
        if 'file' not in self.request.FILES:
            raise ValidationError({'file': ['No file was submitted.']})
        f = self.request.FILES['file']

        # Ensure the upload directory exists before Django tries to write to it
        task_id = self.kwargs['task_pk']
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'attachments', str(task_id))
        os.makedirs(upload_dir, exist_ok=True)

        serializer.save(
            task_id      = task_id,
            uploaded_by  = self.request.user,
            filename     = f.name,
            file_size    = f.size,
            content_type = f.content_type or 'application/octet-stream',
        )


# ─── Comment ViewSet ─────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    author  = UserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model  = TaskComment
        fields = ['id', 'body', 'author', 'is_mine', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request.user == obj.author if request else False


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'post', 'patch', 'delete']
    pagination_class   = None  # always scoped to one task — no pagination needed

    def get_queryset(self):
        return TaskComment.objects.filter(
            task_id=self.kwargs['task_pk']
        ).select_related('author')

    def perform_create(self, serializer):
        serializer.save(task_id=self.kwargs['task_pk'], author=self.request.user)

    def perform_update(self, serializer):
        # Only the author can edit their own comment
        if serializer.instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Cannot edit someone else's comment.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Cannot delete someone else's comment.")
        instance.delete()