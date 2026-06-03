from django.urls import path
from .views import TaskReminderView

urlpatterns = [
    path('tasks/<int:task_id>/reminder/', TaskReminderView.as_view()),
]
