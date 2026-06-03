from django.core.management.base import BaseCommand
# pyrefly: ignore [missing-import]
from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json

class Command(BaseCommand):
    help = 'Register Celery Beat periodic tasks'

    def handle(self, *args, **options):
        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=60,
            period=IntervalSchedule.SECONDS,
        )
        PeriodicTask.objects.update_or_create(
            name='Send due reminders',
            defaults={
                'interval': schedule,
                'task':     'notifications.tasks.send_due_reminders',
                'args':     json.dumps([]),
                'enabled':  True,
            }
        )
        self.stdout.write(self.style.SUCCESS('OK: Periodic tasks registered!'))
