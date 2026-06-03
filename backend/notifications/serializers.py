from rest_framework import serializers
from .models import TaskReminder


class TaskReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TaskReminder
        fields = ['id', 'task', 'reminder_time', 'sent', 'created_at']
        read_only_fields = ['id', 'sent', 'created_at']

    def validate_reminder_time(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Reminder time must be in the future.")
        return value
