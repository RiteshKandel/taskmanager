from django.db.models import Q
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from projects.models import Project
from tasks.models import Task


class GlobalSearchView(APIView):
    """
    GET /api/search/?q=redesign
    Returns tasks + projects matching the query.
    Only returns items the user has access to.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'tasks': [], 'projects': []})

        user = request.user

        # ── Search tasks ─────────────────────────────────────────
        try:
            task_vector = SearchVector('title', weight='A') + SearchVector('description', weight='B')
            task_query  = SearchQuery(q)
            tasks = (
                Task.objects
                .filter(
                    Q(project__owner=user) | Q(project__members=user),
                    is_done=False,
                )
                .annotate(rank=SearchRank(task_vector, task_query))
                .filter(
                    Q(rank__gte=0.01) |
                    Q(title__icontains=q)
                )
                .select_related('project')
                .order_by('-rank', 'title')
                .distinct()[:8]
            )
            task_results = [{
                'id':            t.id,
                'title':         t.title,
                'project_id':    t.project_id,
                'project_title': t.project.title,
                'priority':      t.priority,
                'status':        t.status,
            } for t in tasks]
        except Exception:
            # Fallback to simple icontains if full-text search fails (e.g. older Postgres)
            tasks = (
                Task.objects
                .filter(
                    Q(project__owner=user) | Q(project__members=user),
                    Q(title__icontains=q) | Q(description__icontains=q),
                    is_done=False,
                )
                .select_related('project')
                .distinct()[:8]
            )
            task_results = [{
                'id':            t.id,
                'title':         t.title,
                'project_id':    t.project_id,
                'project_title': t.project.title,
                'priority':      t.priority,
                'status':        t.status,
            } for t in tasks]

        # ── Search projects ───────────────────────────────────────
        projects = (
            Project.objects
            .filter(Q(owner=user) | Q(members=user))
            .filter(
                Q(title__icontains=q) |
                Q(description__icontains=q)
            )
            .distinct()[:5]
        )

        return Response({
            'tasks': task_results,
            'projects': [{
                'id':    p.id,
                'title': p.title,
                'color': p.color,
            } for p in projects],
        })
