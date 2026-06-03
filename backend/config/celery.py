import os
from celery import Celery

# Use dev settings locally; Railway sets DJANGO_SETTINGS_MODULE=config.settings_prod
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('taskmanager')
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()
