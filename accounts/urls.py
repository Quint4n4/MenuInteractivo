from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'accounts'

# Router for admin endpoints
router = DefaultRouter()
router.register(r'admin/users', views.UserManagementViewSet, basename='admin-users')

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),

    # TEMPORARY: Database initialization endpoint (remove after setup)
    path('init-db/', views.init_database_view, name='init-db'),

    # JWT token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin endpoints
    path('', include(router.urls)),
]
