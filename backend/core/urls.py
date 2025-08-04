from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, HealthCheckView

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
] + router.urls