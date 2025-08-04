from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Project Management API",
        default_version='v1',
        description="API documentation for Project Management Dashboard",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),  # Standard admin URL
    path('', include('core.urls')),  # Root URL handler
    path('api/', include('core.urls')),  # Core API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/timelogs/', include('timelogs.urls')),
    path('api/comments/', include('comments.urls')),
    path('api/files/', include('files.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]