from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import secrets
import string
from .models import User, Team
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserDetailSerializer,
    TeamSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from rest_framework.permissions import IsAuthenticated, IsAdminUser

User = get_user_model()

class UserRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserDetailSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

class UserRoleUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, user_id):
        # Only admin and manager can update user roles
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        role = request.data.get('role')
        if role not in dict(User.ROLE_CHOICES):
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = role
        user.save()
        return Response({'detail': f'User role updated to {role}.'})

class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Only admin and manager can view all users
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all()
        serializer = UserDetailSerializer(users, many=True)
        return Response(serializer.data)

class UserDetailByIdView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        # Only admin and manager can view user details
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

class TeamListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Only admin can view all teams
        if request.user.role != 'admin':
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        teams = Team.objects.all()
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)

class ManagerTeamView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Check if user is authenticated
        if not request.user or not hasattr(request.user, 'role'):
            return Response(
                {'detail': 'Authentication required.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Only managers can view their team
        if request.user.role != 'manager':
            return Response(
                {'detail': f'Only managers can access team information. Your role: {request.user.role}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get teams managed by this manager
            managed_teams = request.user.managed_teams.all()
            
            # Log for debugging
            print(f"User {request.user.username} (role: {request.user.role}) manages {managed_teams.count()} teams")
            
            # Get all team members from managed teams
            team_members = User.objects.filter(team__in=managed_teams).select_related('team')
            
            print(f"Found {team_members.count()} team members")
            
            # Return empty list if no team members (this is valid)
            serializer = UserDetailSerializer(team_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in ManagerTeamView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': f'Error fetching team data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Add a debug endpoint to help troubleshoot
class DebugManagerTeamView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        debug_info = {
            'current_user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'team': user.team.name if user.team else None,
                'team_id': user.team.id if user.team else None
            },
            'managed_teams': [],
            'team_members': [],
            'all_teams': [],
            'all_users': []
        }
        
        # Get managed teams
        managed_teams = user.managed_teams.all()
        for team in managed_teams:
            debug_info['managed_teams'].append({
                'id': team.id,
                'name': team.name,
                'manager': team.manager.username,
                'member_count': team.members.count()
            })
        
        # Get team members
        team_members = User.objects.filter(team__in=managed_teams)
        for member in team_members:
            debug_info['team_members'].append({
                'id': member.id,
                'username': member.username,
                'role': member.role,
                'team': member.team.name if member.team else None
            })
        
        # Get all teams for reference
        all_teams = Team.objects.all()
        for team in all_teams:
            debug_info['all_teams'].append({
                'id': team.id,
                'name': team.name,
                'manager': team.manager.username,
                'member_count': team.members.count()
            })
        
        # Get all users for reference
        all_users = User.objects.all()
        for u in all_users:
            debug_info['all_users'].append({
                'id': u.id,
                'username': u.username,
                'role': u.role,
                'team': u.team.name if u.team else None
            })
        
        return Response(debug_info)

class TeamCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        # Only admin can create teams
        if request.user.role != 'admin':
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserTeamAssignmentView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, user_id):
        # Only admin can assign users to teams
        if request.user.role != 'admin':
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        team_id = request.data.get('team')
        if not team_id:
            return Response({'detail': 'Team ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        user.team = team
        user.save()
        return Response({'detail': f'User {user.username} assigned to team {team.name}.'})

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Don't reveal that the email doesn't exist
                return Response({
                    'detail': 'If an account exists with this email, a password reset link has been sent.'
                }, status=status.HTTP_200_OK)
            
            # Generate a random token
            token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            
            # Store token in Redis with 1-hour expiry
            cache.set(f'password_reset_{token}', str(user.id), timeout=3600)
            
            # Get the frontend URL from environment variable
            frontend_url = settings.FRONTEND_URL or 'http://localhost:3000'
            reset_url = f"{frontend_url}/reset-password?token={token}"
            
            email_content = f"""
            Hello {user.username},
            
            You requested a password reset for your account.
            Click the following link to reset your password:
            
            {reset_url}
            
            This link will expire in 1 hour.
            
            If you didn't request this, please ignore this email.
            
            Best regards,
            Project Management Team
            """
            
            try:
                send_mail(
                    'Password Reset Request',
                    email_content,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
                # In development, print the reset URL
                if settings.DEBUG:
                    print(f"Reset URL: {reset_url}")
            
            return Response({
                'detail': 'If an account exists with this email, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            # Get user_id from Redis
            cache_key = f'password_reset_{token}'
            user_id = cache.get(cache_key)
            
            if not user_id:
                return Response({
                    'detail': 'Invalid or expired reset token.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
                user.set_password(new_password)
                user.save()
                
                # Delete the used token
                cache.delete(cache_key)
                
                return Response({
                    'detail': 'Password reset successfully.'
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response({
                    'detail': 'User not found.'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)