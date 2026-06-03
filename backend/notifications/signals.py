from django.db.models.signals import post_save
from django.dispatch import receiver
import threading

from tasks.models import Task
from projects.models import ProjectMember
from .email_service import send_task_notification, send_project_invite_email


def _bg(fn, *args, **kwargs):
    """Run in background thread so it doesn't slow down API responses."""
    threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True).start()


@receiver(post_save, sender=Task)
def on_task_saved(sender, instance: Task, created: bool, **kwargs):
    trigger_user = instance.created_by
    if not trigger_user:
        return
    action = 'created' if created else ('completed' if instance.is_done else 'updated')
    _bg(send_task_notification, trigger_user, instance, action)


@receiver(post_save, sender=ProjectMember)
def on_member_added(sender, instance: ProjectMember, created: bool, **kwargs):
    if not created:
        return
    if instance.user == instance.project.owner:
        return
    _bg(send_project_invite_email, instance.user, instance.project, instance.project.owner, instance.role)
