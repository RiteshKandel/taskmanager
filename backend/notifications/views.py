from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TaskReminder
from .serializers import TaskReminderSerializer


class TaskReminderView(APIView):
    """
    GET    /api/tasks/{task_id}/reminder/  → get current user's reminder (or null)
    POST   /api/tasks/{task_id}/reminder/  → set / update reminder
    DELETE /api/tasks/{task_id}/reminder/  → remove reminder
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            reminder = TaskReminder.objects.get(task_id=task_id, user=request.user)
            return Response(TaskReminderSerializer(reminder).data)
        except TaskReminder.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

    def post(self, request, task_id):
        existing = TaskReminder.objects.filter(task_id=task_id, user=request.user).first()
        data = {'task': task_id, 'reminder_time': request.data.get('reminder_time')}
        serializer = TaskReminderSerializer(existing, data=data, partial=bool(existing))
        serializer.is_valid(raise_exception=True)
        if existing:
            serializer.save(sent=False)   # reset sent flag when rescheduled
        else:
            serializer.save(user=request.user, task_id=task_id)
        return Response(serializer.data)

    def delete(self, request, task_id):
        TaskReminder.objects.filter(task_id=task_id, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
