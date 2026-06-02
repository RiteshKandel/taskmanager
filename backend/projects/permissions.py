from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsProjectMember(BasePermission):
    """Allow any project member (viewer+) to read. Deny everyone else."""
    message = 'You are not a member of this project.'

    def has_object_permission(self, request, view, obj):
        return obj.can_view(request.user)


class IsProjectEditor(BasePermission):
    """
    Read access: any member.
    Write access: owner, admin, or editor.
    """
    message = 'You need editor access or higher to do this.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.can_view(request.user)
        return obj.can_edit(request.user)


class IsProjectAdmin(BasePermission):
    """
    Read access: any member.
    Write access: owner or admin only.
    """
    message = 'You need admin access or higher to do this.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.can_view(request.user)
        return obj.can_manage(request.user)


class IsProjectOwner(BasePermission):
    """Only the project owner can perform this action."""
    message = 'Only the project owner can do this.'

    def has_object_permission(self, request, view, obj):
        return obj.can_delete_project(request.user)