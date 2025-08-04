from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import connections
from django.db.utils import OperationalError

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Check database connection
        db_healthy = True
        try:
            connections['default'].cursor()
        except OperationalError:
            db_healthy = False

        status_code = status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response({
            "status": "healthy" if db_healthy else "unhealthy",
            "database": "connected" if db_healthy else "disconnected",
            "version": "1.0"
        }, status=status_code)

class RootAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            "message": "API is running",
            "endpoints": {
                "health_check": "/api/health/",
                "register": "/api/accounts/register/",
                "login": "/api/accounts/login/",
                "docs": "/swagger/"
            }
        })