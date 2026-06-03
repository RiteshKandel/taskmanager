from django.db import models
from django.conf import settings


class TaskReminder(models.Model):
    """
    One row per reminder. When reminder_time passes and sent=False,
    Celery picks it up, sends the email, sets sent=True.
    """
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    reminder_time = models.DateTimeField()   # when to send the email
    sent          = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['task', 'user']
        ordering = ['reminder_time']

    def __str__(self):
        return f"Reminder: {self.user.email} → {self.task.title} at {self.reminder_time}"
