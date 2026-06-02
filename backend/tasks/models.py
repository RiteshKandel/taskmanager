from django.db import models
from django.conf import settings
from projects.models import Project, Label


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