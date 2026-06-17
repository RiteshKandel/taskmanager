from rest_framework import serializers
import bleach
from .models import Task
from users.serializers import UserSerializer
from projects.serializers import LabelSerializer

# Tags and attributes Tiptap is allowed to produce
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 's', 'u', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'a', 'img',
]
ALLOWED_ATTRS = {
    'a':   ['href', 'title', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    'li':  ['data-checked'],     # for task list items
    'ul':  ['data-type'],        # for taskList type
}


class TaskListSerializer(serializers.ModelSerializer):
    # Lightweight — for rendering rows in the task list
    assignees    = UserSerializer(many=True, read_only=True)
    labels       = LabelSerializer(many=True, read_only=True)
    subtask_count= serializers.SerializerMethodField()

    class Meta:
        model  = Task
        fields = ['id', 'title', 'is_done', 'status', 'priority',
                  'due_date', 'start_date', 'position', 'assignees', 'labels',
                  'subtask_count', 'parent', 'project']

    def get_subtask_count(self, obj):
        return obj.subtasks.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    # Full data — for the task detail panel
    assignees  = UserSerializer(many=True, read_only=True)
    assignee_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True,
        source='assignees',
        queryset=__import__('django.contrib.auth', fromlist=['get_user_model']).get_user_model().objects.all(),
        required=False
    )
    labels     = LabelSerializer(many=True, read_only=True)
    label_ids  = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True,
        source='labels',
        queryset=__import__('projects.models', fromlist=['Label']).Label.objects.all(),
        required=False
    )
    created_by = UserSerializer(read_only=True)
    subtasks   = TaskListSerializer(many=True, read_only=True)

    class Meta:
        model  = Task
        fields = ['id', 'title', 'description', 'is_done', 'status',
                  'priority', 'due_date', 'start_date', 'position',
                  'project', 'parent', 'created_by',
                  'assignees', 'assignee_ids', 'labels', 'label_ids',
                  'subtasks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate_description(self, value: str) -> str:
        # Strip any unsafe HTML before saving to the database
        if not value:
            return value
        return bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)