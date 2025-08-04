from django.urls import path
from .views import HealthCheckView, RootAPIView

urlpatterns = [
    path('', RootAPIView.as_view(), name='api-root'),
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
]