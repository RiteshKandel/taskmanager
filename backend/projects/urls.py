from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ProjectViewSet, LabelViewSet, MemberViewSet

# Main router — /api/projects/ and /api/labels/
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'labels',   LabelViewSet,   basename='label')

# Nested: /api/projects/{project_pk}/members/
projects_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
projects_router.register(r'members', MemberViewSet, basename='project-members')

urlpatterns = router.urls + projects_router.urls