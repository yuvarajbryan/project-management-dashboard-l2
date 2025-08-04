from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Project, Task
from .serializers import ProjectSerializer, ProjectDetailSerializer, TaskSerializer
from accounts.models import User

class IsAdminManagerOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if user.role == 'manager':
            # Managers can only access their team members' tasks
            if hasattr(obj, 'assigned_to') and obj.assigned_to:
                return user.is_team_member(obj.assigned_to)
            return True
        if hasattr(obj, 'owner'):
            return obj.owner == user
        if hasattr(obj, 'assigned_to') and obj.assigned_to:
            return obj.assigned_to == user
        return False

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminManagerOrOwner]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        # Only admins can create projects
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can create projects.")
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Project.objects.all()
        return Project.objects.filter(owner=user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminManagerOrOwner]

    def perform_create(self, serializer):
        user = self.request.user
        
        print(f"TaskViewSet.perform_create - User: {user.username} ({user.role})")
        print(f"Validated data: {serializer.validated_data}")
        
        # If it's a manager, check if they're assigning to their team member
        if user.role == 'manager':
            assigned_to_data = serializer.validated_data.get('assigned_to')
            print(f"Assigned to data: {assigned_to_data}, type: {type(assigned_to_data)}")
            
            if assigned_to_data:
                # assigned_to_data might be a User object or an ID
                if isinstance(assigned_to_data, User):
                    assigned_user = assigned_to_data
                else:
                    try:
                        assigned_user = User.objects.get(id=assigned_to_data)
                    except (User.DoesNotExist, ValueError, TypeError):
                        raise PermissionDenied("Invalid user assignment.")
                
                print(f"Checking if {user.username} can assign to {assigned_user.username}")
                print(f"Manager teams: {list(user.managed_teams.all())}")
                print(f"Assigned user team: {assigned_user.team}")
                
                if not user.is_team_member(assigned_user):
                    raise PermissionDenied(f"You can only assign tasks to your team members. {assigned_user.username} is not in your team.")
        
        # Save the task
        task = serializer.save()
        print(f"Task created: {task.title} assigned to {task.assigned_to}")

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Task.objects.all()
        elif user.role == 'manager':
            # Managers can only see tasks assigned to their team members
            team_members = user.get_team_members()
            return Task.objects.filter(assigned_to__in=team_members)
        return Task.objects.filter(assigned_to=user)