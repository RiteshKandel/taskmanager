# Import Celery app so it starts with Django when running the worker.
# Wrapped in try/except so 'python manage.py runserver' still works
# even when celery is not installed in the current Python environment.
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    pass
