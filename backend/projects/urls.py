from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from django.urls import path
from .views import ProjectViewSet, LabelViewSet, MemberViewSet
from .forum_views import ForumPostViewSet, MemberProjectMatrixView

# Main router — /api/projects/ and /api/labels/
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'labels',   LabelViewSet,   basename='label')
router.register(r'forum',    ForumPostViewSet, basename='forum')

# Nested: /api/projects/{project_pk}/members/
projects_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
projects_router.register(r'members', MemberViewSet, basename='project-members')

urlpatterns = router.urls + projects_router.urls + [
    path('member-matrix/', MemberProjectMatrixView.as_view(), name='member-matrix'),
]