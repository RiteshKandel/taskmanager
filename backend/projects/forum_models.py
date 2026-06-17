from django.db import models
from django.conf import settings


class ForumPost(models.Model):
    """
    A global forum post visible to all authenticated users.
    Supports @mention syntax — mentioned users are stored in the M2M field.
    """
    author     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forum_posts'
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
        preview = self.content[:50] + ('…' if len(self.content) > 50 else '')
        return f"{self.author.email}: {preview}"
