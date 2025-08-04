from django.urls import path
from .views import HealthCheckView, RootAPIView

app_name = 'core'

urlpatterns = [
    path('', RootAPIView.as_view(), name='api-root'),
    path('core/health/', HealthCheckView.as_view(), name='health-check'),
]