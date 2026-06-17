from django.db import models
from django.conf import settings


class Project(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects'
    )
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color       = models.CharField(max_length=7, default='#4F46E5')
    icon        = models.CharField(max_length=50, blank=True)
    parent      = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='subprojects'
    )

    # Uses ProjectMember as the explicit join table so membership carries a role field.
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProjectMember',
        related_name='member_projects',
        blank=True
    )

    is_archived = models.BooleanField(default=False)
    position    = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', 'created_at']

    def __str__(self):
        return self.title

    def get_member_role(self, user):
        """Returns the user's role string, or None if not a member."""
        if self.owner_id == user.id:
            return ProjectMember.Role.OWNER
        try:
            return self.projectmember_set.get(user=user).role
        except ProjectMember.DoesNotExist:
            return None

    def can_view(self, user):
        return self.get_member_role(user) is not None

    def can_edit(self, user):
        return self.get_member_role(user) in (
            ProjectMember.Role.OWNER,
            ProjectMember.Role.ADMIN,
            ProjectMember.Role.EDITOR,
        )

    def can_manage(self, user):
        """Owner and admin can manage members and project settings."""
        return self.get_member_role(user) in (
            ProjectMember.Role.OWNER,
            ProjectMember.Role.ADMIN,
        )

    def can_delete_project(self, user):
        return self.owner_id == user.id


class ProjectMember(models.Model):
    """Join table between Project and User that stores the membership role."""

    class Role(models.TextChoices):
        OWNER  = 'owner',  'Owner'   # auto-assigned on project creation, not set manually
        ADMIN  = 'admin',  'Admin'
        EDITOR = 'editor', 'Editor'
        VIEWER = 'viewer', 'Viewer'

    project  = models.ForeignKey(Project, on_delete=models.CASCADE)
    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role     = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['project', 'user']
        ordering = ['added_at']

    def __str__(self):
        return f"{self.user.email} → {self.project.title} ({self.role})"


class Label(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6366F1')

    def __str__(self):
        return self.title