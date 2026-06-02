from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

import os
from django.http import JsonResponse
def debug_db(request): url = os.environ.get('DATABASE_URL', ''); import re; url = re.sub(r':([^:@]+)@', ':***@', url); return JsonResponse({'db_url': url})

urlpatterns = [
    path('debug_db/', debug_db),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/',    views.LoginView.as_view(),    name='login'),
    path('logout/',   views.LogoutView.as_view(),   name='logout'),
    path('refresh/',  TokenRefreshView.as_view(),   name='token_refresh'),
    path('me/',       views.MeView.as_view(),       name='me'),
]
