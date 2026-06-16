from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ProjectViewSet, LabelViewSet, MemberViewSet, ProjectMessageViewSet

# Main router — /api/projects/ and /api/labels/
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'labels',   LabelViewSet,   basename='label')

# Nested: /api/projects/{project_pk}/members/ and /api/projects/{project_pk}/messages/
projects_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
projects_router.register(r'members',  MemberViewSet,         basename='project-members')
projects_router.register(r'messages', ProjectMessageViewSet, basename='project-messages')

urlpatterns = router.urls + projects_router.urls