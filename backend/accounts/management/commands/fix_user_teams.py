from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Team

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix user team relationships'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Username to fix')
        parser.add_argument('--create-team', action='store_true', help='Create a team if none exists')

    def handle(self, *args, **options):
        username = options.get('username')
        
        if username:
            try:
                user = User.objects.get(username=username)
                self.fix_user(user, options.get('create_team', False))
            except User.DoesNotExist:
                self.stdout.write(f'User {username} not found')
        else:
            # Fix all manager users
            managers = User.objects.filter(role='manager')
            for manager in managers:
                self.fix_user(manager, options.get('create_team', False))

    def fix_user(self, user, create_team=False):
        self.stdout.write(f'\n=== Fixing user: {user.username} ===')
        self.stdout.write(f'Current role: {user.role}')
        self.stdout.write(f'Current team: {user.team}')
        
        if user.role == 'manager':
            # Managers should not be assigned to teams
            if user.team:
                self.stdout.write(f'Manager {user.username} is assigned to team {user.team.name}. Removing...')
                user.team = None
                user.save()
            
            # Check if manager has teams to manage
            managed_teams = user.managed_teams.all()
            self.stdout.write(f'Manager manages {managed_teams.count()} teams: {list(managed_teams)}')
            
            if not managed_teams and create_team:
                # Create a team for this manager
                team_name = f"{user.username}'s Team"
                team, created = Team.objects.get_or_create(
                    name=team_name,
                    defaults={'manager': user}
                )
                if created:
                    self.stdout.write(f'Created team "{team_name}" for manager {user.username}')
                else:
                    self.stdout.write(f'Team "{team_name}" already exists')
                
                # Create some test developers for this team
                for i in range(1, 3):
                    dev_username = f"{user.username}_dev{i}"
                    dev, created = User.objects.get_or_create(
                        username=dev_username,
                        defaults={
                            'email': f'{dev_username}@example.com',
                            'role': 'developer',
                            'team': team
                        }
                    )
                    if created:
                        dev.set_password('dev123')
                        dev.save()
                        self.stdout.write(f'Created developer {dev_username} in team {team.name}')
            
            # Test the team access
            team_members = User.objects.filter(team__in=user.managed_teams.all())
            self.stdout.write(f'Team members accessible by {user.username}: {team_members.count()}')
            for member in team_members:
                self.stdout.write(f'  - {member.username} ({member.role}) in {member.team.name}')

        self.stdout.write(f'Fix complete for {user.username}\n')