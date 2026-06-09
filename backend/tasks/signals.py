from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task, TaskComment, TaskAttachment, ActivityLog


@receiver(post_save, sender=Task)
def log_task_changes(sender, instance, created, **kwargs):
    try:
        # Resolve the actor — _current_user is set by the view; fall back to created_by
        actor = getattr(instance, '_current_user', None)
        if actor is None:
            # Access created_by safely; if not loaded yet, skip logging
            actor = instance.__dict__.get('created_by_id')
            if actor is None:
                return
            from django.contrib.auth import get_user_model
            try:
                actor = get_user_model().objects.get(pk=actor)
            except Exception:
                return

        if created:
            ActivityLog.objects.create(
                task=instance, actor=actor, action=ActivityLog.Action.CREATED
            )
        else:
            # Only log COMPLETED when is_done explicitly transitions to True in this save
            update_fields = kwargs.get('update_fields')
            if update_fields is None or 'is_done' in update_fields or 'status' in update_fields:
                if instance.is_done:
                    # Avoid duplicate logs: check if a COMPLETED entry already exists
                    already_logged = ActivityLog.objects.filter(
                        task=instance, action=ActivityLog.Action.COMPLETED
                    ).exists()
                    if not already_logged:
                        ActivityLog.objects.create(
                            task=instance, actor=actor, action=ActivityLog.Action.COMPLETED
                        )
    except Exception:
        pass   # Never let logging crash the main request


@receiver(post_save, sender=TaskComment)
def log_comment(sender, instance, created, **kwargs):
    try:
        if created:
            ActivityLog.objects.create(
                task=instance.task, actor=instance.author,
                action=ActivityLog.Action.COMMENTED
            )
    except Exception:
        pass


@receiver(post_save, sender=TaskAttachment)
def log_attachment(sender, instance, created, **kwargs):
    try:
        if created:
            ActivityLog.objects.create(
                task=instance.task, actor=instance.uploaded_by,
                action=ActivityLog.Action.FILE_ADDED,
                detail=instance.filename
            )
    except Exception:
        pass

