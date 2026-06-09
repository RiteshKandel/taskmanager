from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TaskReminder
from .serializers import TaskReminderSerializer


class TaskReminderView(APIView):
    """
    GET    /api/tasks/{task_id}/reminder/  → get all current user's reminders
    POST   /api/tasks/{task_id}/reminder/  → create new reminder
    DELETE /api/tasks/{task_id}/reminder/{reminder_id}/  → remove reminder
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        reminders = TaskReminder.objects.filter(task_id=task_id, user=request.user)
        return Response(TaskReminderSerializer(reminders, many=True).data)

    def post(self, request, task_id):
        data = {'task': task_id, 'reminder_time': request.data.get('reminder_time')}
        serializer = TaskReminderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, task_id=task_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, task_id, reminder_id=None):
        if reminder_id:
            TaskReminder.objects.filter(id=reminder_id, task_id=task_id, user=request.user).delete()
        else:
            TaskReminder.objects.filter(task_id=task_id, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
