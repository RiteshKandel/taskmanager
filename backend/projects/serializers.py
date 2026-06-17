from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectMember, Label
from users.serializers import UserSerializer

User = get_user_model()


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'title', 'color']
        read_only_fields = ['id']


class ProjectListSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.name', read_only=True)

    class Meta:
        model  = Project
        fields = ['id', 'title', 'color', 'icon', 'owner_name',
                  'task_count', 'position', 'parent', 'is_archived']

    def get_task_count(self, obj):
        return obj.tasks.filter(is_done=False).count()


class ProjectTreeSerializer(serializers.ModelSerializer):
    """
    Returns a project with its subprojects nested inside.
    Uses context['all_projects'] to avoid extra DB queries.
    """
    task_count  = serializers.SerializerMethodField()
    owner_name  = serializers.CharField(source='owner.name', read_only=True)
    subprojects = serializers.SerializerMethodField()
    my_role     = serializers.SerializerMethodField()

    class Meta:
        model  = Project
        fields = [
            'id', 'title', 'color', 'icon', 'position',
            'parent', 'is_archived', 'task_count',
            'owner_name', 'my_role', 'subprojects',
        ]

    def get_task_count(self, obj):
        return obj.tasks.filter(is_done=False).count()

    def get_subprojects(self, obj):
        # Filter from the pre-fetched all_projects list to avoid N+1 queries.
        all_projects = self.context.get('all_projects', [])
        children = [p for p in all_projects if p.parent_id == obj.pk]
        return ProjectTreeSerializer(children, many=True, context=self.context).data

    def get_my_role(self, obj):
        request = self.context.get('request')
        return obj.get_member_role(request.user) if request else None


class ProjectMemberSerializer(serializers.ModelSerializer):
    user  = UserSerializer(read_only=True)
    email = serializers.EmailField(write_only=True)  # accepted on write, resolved to a User

    class Meta:
        model  = ProjectMember
        fields = ['id', 'user', 'email', 'role', 'added_at']
        read_only_fields = ['id', 'user', 'added_at']

    def validate_email(self, value):
        try:
            self._resolved_user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No account found with this email address.')
        return value

    def validate(self, data):
        project = self.context['project']
        user    = self._resolved_user
        if project.owner == user:
            raise serializers.ValidationError('This user is the project owner.')
        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError('This user is already a member.')
        data['user'] = user
        return data

    def create(self, validated_data):
        validated_data.pop('email')  # email is not a model field
        return ProjectMember.objects.create(**validated_data)


class ProjectDetailSerializer(serializers.ModelSerializer):
    owner       = UserSerializer(read_only=True)
    members     = serializers.SerializerMethodField()
    subprojects = ProjectListSerializer(many=True, read_only=True)
    my_role     = serializers.SerializerMethodField()

    class Meta:
        model  = Project
        fields = ['id', 'title', 'description', 'color', 'icon',
                  'owner', 'members', 'subprojects', 'parent',
                  'is_archived', 'default_view', 'position', 'my_role',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_members(self, obj):
        memberships = obj.projectmember_set.select_related('user').all()
        return ProjectMemberSerializer(memberships, many=True).data

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request:
            return obj.get_member_role(request.user)
        return None

    def validate_parent(self, value):
        if value is None:
            return value
        if self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError('A project cannot be its own parent.')
        if self.instance:
            def is_descendant(project, target):
                for child in project.subprojects.all():
                    if child.pk == target.pk or is_descendant(child, target):
                        return True
                return False
            if is_descendant(self.instance, value):
                raise serializers.ValidationError('Cannot set a subproject as the parent.')
        return value
