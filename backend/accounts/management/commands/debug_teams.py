from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Team

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug team and user relationships'

    def handle(self, *args, **options):
        self.stdout.write('=== DEBUG TEAM RELATIONSHIPS ===\n')

        # List all users
        self.stdout.write('ALL USERS:')
        for user in User.objects.all():
            team_info = f"Team: {user.team.name}" if user.team else "No team"
            managed_teams = user.managed_teams.all()
            managed_info = f"Manages: {', '.join([t.name for t in managed_teams])}" if managed_teams else "Manages: None"
            self.stdout.write(f'  {user.username} ({user.role}) - {team_info} - {managed_info}')

        self.stdout.write('\nALL TEAMS:')
        for team in Team.objects.all():
            members = team.members.all()
            self.stdout.write(f'  {team.name}:')
            self.stdout.write(f'    Manager: {team.manager.username}')
            self.stdout.write(f'    Members: {members.count()}')
            for member in members:
                self.stdout.write(f'      - {member.username} ({member.role})')

        # Test manager team queries
        self.stdout.write('\nMANAGER TEAM QUERIES:')
        for user in User.objects.filter(role='manager'):
            managed_teams = user.managed_teams.all()
            self.stdout.write(f'  {user.username} manages {managed_teams.count()} teams:')
            for team in managed_teams:
                team_members = User.objects.filter(team=team)
                self.stdout.write(f'    - {team.name}: {team_members.count()} members')
                for member in team_members:
                    self.stdout.write(f'      * {member.username}')

        self.stdout.write('\n=== END DEBUG ===\n')