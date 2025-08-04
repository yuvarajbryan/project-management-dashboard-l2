from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import connections
from django.db.utils import OperationalError
from django.core.cache import cache

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Check database connection
        db_healthy = True
        try:
            connections['default'].cursor()
        except OperationalError:
            db_healthy = False

        # Check cache connection
        cache_healthy = True
        try:
            cache.set('health_check', 'ok', 1)
            cache.get('health_check')
        except Exception:
            cache_healthy = False

        status_code = status.HTTP_200_OK if (db_healthy and cache_healthy) else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response({
            "status": "healthy" if (db_healthy and cache_healthy) else "unhealthy",
            "database": "connected" if db_healthy else "disconnected",
            "cache": "connected" if cache_healthy else "disconnected"
        }, status=status_code)