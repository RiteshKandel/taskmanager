from django.db import models
from django.conf import settings


class ForumPost(models.Model):
    """
    A forum post that can be either global (project=NULL) or project-scoped.
    - Global posts are visible to all authenticated users.
    - Project-scoped posts are visible only to members of that project.
    Supports @mention syntax — mentioned users are stored in the M2M field.
    """
    author     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forum_posts'
    )
    project    = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='forum_posts',
        help_text='NULL = global forum; set = project-scoped forum'
    )
    content    = models.TextField(max_length=2000)
    mentions   = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='mentioned_in_posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        scope = f"[{self.project.title}]" if self.project else "[Global]"
        preview = self.content[:50] + ('…' if len(self.content) > 50 else '')
        return f"{scope} {self.author.email}: {preview}"
