from django.contrib import admin
from .models import TaskReminder

@admin.register(TaskReminder)
class TaskReminderAdmin(admin.ModelAdmin):
    list_display  = ['task', 'user', 'reminder_time', 'sent']
    list_filter   = ['sent']
    search_fields = ['task__title', 'user__email']
