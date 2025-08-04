from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import IntegrityError
from .models import TimeLog
from .serializers import TimeLogSerializer
from accounts.models import User

class IsAdminManagerOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow authenticated users to create timelogs
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ['admin', 'manager']:
            return True
        return obj.user == user

class TimeLogViewSet(viewsets.ModelViewSet):
    queryset = TimeLog.objects.all().order_by('-created_at')
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminManagerOrOwner]

    def create(self, request, *args, **kwargs):
        # Check if user has already logged time for this task
        task_id = request.data.get('task')
        if task_id:
            existing_log = TimeLog.objects.filter(
                task_id=task_id,
                user=request.user
            ).first()
            
            if existing_log:
                return Response(
                    {'error': 'You have already logged time for this task.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return TimeLog.objects.all()
        return TimeLog.objects.filter(user=user)
