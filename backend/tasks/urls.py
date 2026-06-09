from rest_framework_nested import routers
from .views import TaskViewSet, AttachmentViewSet, CommentViewSet

router = routers.DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

tasks_router = routers.NestedDefaultRouter(router, r'tasks', lookup='task')
tasks_router.register(r'attachments', AttachmentViewSet, basename='task-attachments')
tasks_router.register(r'comments',    CommentViewSet,    basename='task-comments')

urlpatterns = router.urls + tasks_router.urls