#!/usr/bin/env python
"""
Start Celery worker programmatically, bypassing the buggy CLI
argument parsing in Celery 5.6 that crashes with:
  AttributeError: 'Settings' object has no attribute 'worker_state_db'
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_prod')

import django
django.setup()

from config.celery import app

app.worker_main([
    'worker',
    '--loglevel=info',
    '--concurrency=2',
])
