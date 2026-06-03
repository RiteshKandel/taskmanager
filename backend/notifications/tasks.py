from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_due_reminders():
    """
    Called by Celery Beat every 60 seconds.
    Finds all unsent reminders whose time has passed and sends them.
    """
    from .models import TaskReminder
    from .email_service import send_reminder_email

    now = timezone.now()
    due = TaskReminder.objects.filter(
        sent=False,
        reminder_time__lte=now
    ).select_related('task', 'task__project', 'user')

    count = 0
    for reminder in due:
        try:
            send_reminder_email(reminder.user, reminder.task)
            reminder.sent = True
            reminder.save(update_fields=['sent'])
            count += 1
        except Exception as e:
            logger.error("Failed to send reminder %s: %s", reminder.id, e)

    if count:
        logger.info("Sent %d reminder(s)", count)
    return count
