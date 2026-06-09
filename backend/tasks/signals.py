from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task, TaskComment, TaskAttachment, ActivityLog


@receiver(post_save, sender=Task)
def log_task_changes(sender, instance, created, **kwargs):
    actor = getattr(instance, '_current_user', instance.created_by)
    if not actor:
        return

    if created:
        ActivityLog.objects.create(
            task=instance, actor=actor, action=ActivityLog.Action.CREATED
        )
    elif instance.is_done:
        ActivityLog.objects.create(
            task=instance, actor=actor, action=ActivityLog.Action.COMPLETED
        )


@receiver(post_save, sender=TaskComment)
def log_comment(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance.task, actor=instance.author,
            action=ActivityLog.Action.COMMENTED
        )


@receiver(post_save, sender=TaskAttachment)
def log_attachment(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            task=instance.task, actor=instance.uploaded_by,
            action=ActivityLog.Action.FILE_ADDED,
            detail=instance.filename
        )
