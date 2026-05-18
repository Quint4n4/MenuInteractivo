"""
URL configuration for clinic_service project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([])  # El healthcheck de Railway lo sondea seguido: nunca limitar
def health_check(request):
    """Health check endpoint"""
    return Response({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check, name='health'),

    # Authentication endpoints
    path('api/auth/', include('accounts.urls')),

    # Clinic endpoints
    path('api/clinic/', include('clinic.urls')),

    # Catalog endpoints (Staff)
    path('api/catalog/', include('catalog.urls')),

    # Inventory endpoints (Staff)
    path('api/inventory/', include('inventory.urls')),

    # Orders endpoints (Staff)
    path('api/orders/', include('orders.urls')),

    # Feedback endpoints (Staff)
    path('api/', include('feedbacks.urls')),

    # Reports endpoints (Staff)
    path('api/', include('report_analytics.urls')),

    # Public endpoints (No authentication required)
    path('api/public/', include('catalog.public_urls')),
    path('api/public/', include('orders.public_urls')),
    path('api/public/', include('clinic.public_urls')),
]

# Serve media files (category icons, etc.) in development and production
# so the kiosk landing can load product images from /media/category-icons/
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
