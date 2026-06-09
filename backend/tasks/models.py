from django.db import models
from django.conf import settings
from projects.models import Project, Label
import os
from django.core.exceptions import ValidationError


class Task(models.Model):
    # Priority choices — named constants prevent typos
    class Priority(models.IntegerChoices):
        NONE   = 0, 'None'
        LOW    = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH   = 3, 'High'
        URGENT = 4, 'Urgent'

    class Status(models.TextChoices):
        TODO       = 'todo',        'To Do'
        IN_PROGRESS= 'in_progress', 'In Progress'
        DONE       = 'done',        'Done'

    # Relationships
    project    = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    assignees  = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks', blank=True)
    labels     = models.ManyToManyField(Label, related_name='tasks', blank=True)

    # Subtask support: a task can have a parent task
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='subtasks'
    )

    # Core fields
    title       = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    is_done     = models.BooleanField(default=False)
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority    = models.IntegerField(choices=Priority.choices, default=Priority.NONE)

    # Scheduling
    due_date    = models.DateTimeField(null=True, blank=True)
    start_date  = models.DateTimeField(null=True, blank=True)

    # Position controls ordering within the project
    position    = models.PositiveIntegerField(default=0)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', 'created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-sync is_done with status
        if self.status == self.Status.DONE:
            self.is_done = True
        elif self.is_done:
            self.status = self.Status.DONE
        super().save(*args, **kwargs)


def attachment_upload_path(instance, filename):
    # instance.task_id is always set before file is written (passed via serializer.save)
    import re, os
    # Sanitize filename to prevent directory traversal
    safe = re.sub(r'[^\w.\-]', '_', os.path.basename(filename))
    return f'attachments/{instance.task_id}/{safe}'


def validate_file_size(value):
    # Max 1 MB per file
    if value.size > 1 * 1024 * 1024:
        raise ValidationError('File size must be under 1 MB.')


class TaskAttachment(models.Model):
    task        = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file        = models.FileField(upload_to=attachment_upload_path, validators=[validate_file_size])
    filename    = models.CharField(max_length=255)      # original name
    file_size   = models.PositiveIntegerField()          # bytes
    content_type= models.CharField(max_length=100)      # e.g. image/png
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.filename


class TaskComment(models.Model):
    task       = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"


class ActivityLog(models.Model):
    class Action(models.TextChoices):
        CREATED   = 'created',    'Created'
        UPDATED   = 'updated',    'Updated'
        COMPLETED = 'completed',  'Completed'
        COMMENTED = 'commented',  'Commented'
        ASSIGNED  = 'assigned',   'Assigned'
        FILE_ADDED= 'file_added', 'Attached file'
        STATUS_CHANGED = 'status_changed', 'Changed status'

    task       = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity')
    actor      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action     = models.CharField(max_length=30, choices=Action.choices)
    detail     = models.CharField(max_length=255, blank=True)   # e.g. "status: todo → done"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']