#!/usr/bin/env python
"""
Start Celery beat programmatically, bypassing the buggy CLI
argument parsing in Celery 5.6.
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_prod')

import django
django.setup()

from config.celery import app

app.Beat(loglevel='info', scheduler='django_celery_beat.schedulers:DatabaseScheduler').run()
