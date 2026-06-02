from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

import os
from django.http import JsonResponse
def debug_db(request): return JsonResponse({'db_len': len(os.environ.get('DATABASE_URL', '')), 'db_prefix': os.environ.get('DATABASE_URL', '')[:15]})

urlpatterns = [
    path('debug_db/', debug_db),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/',    views.LoginView.as_view(),    name='login'),
    path('logout/',   views.LogoutView.as_view(),   name='logout'),
    path('refresh/',  TokenRefreshView.as_view(),   name='token_refresh'),
    path('me/',       views.MeView.as_view(),       name='me'),
]
