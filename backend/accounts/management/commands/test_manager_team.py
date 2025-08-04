from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Team

User = get_user_model()

class Command(BaseCommand):
    help = 'Test manager team functionality'

    def handle(self, *args, **options):
        self.stdout.write('=== TESTING MANAGER TEAM FUNCTIONALITY ===\n')

        # Find or create test data
        manager, created = User.objects.get_or_create(
            username='testmanager',
            defaults={'role': 'manager', 'email': 'manager@test.com'}
        )
        if created:
            manager.set_password('test123')
            manager.save()
            self.stdout.write(f'Created manager: {manager.username}')

        team, created = Team.objects.get_or_create(
            name='Test Team',
            defaults={'manager': manager}
        )
        if created:
            self.stdout.write(f'Created team: {team.name}')

        # Create test developers
        dev1, created = User.objects.get_or_create(
            username='testdev1',
            defaults={'role': 'developer', 'email': 'dev1@test.com', 'team': team}
        )
        if created:
            dev1.set_password('test123')
            dev1.save()
            self.stdout.write(f'Created developer: {dev1.username}')

        dev2, created = User.objects.get_or_create(
            username='testdev2',
            defaults={'role': 'developer', 'email': 'dev2@test.com', 'team': team}
        )
        if created:
            dev2.set_password('test123')
            dev2.save()
            self.stdout.write(f'Created developer: {dev2.username}')

        # Test the functionality
        self.stdout.write('\n--- Testing manager team relationships ---')
        
        managed_teams = manager.managed_teams.all()
        self.stdout.write(f'Manager {manager.username} manages {managed_teams.count()} teams:')
        for t in managed_teams:
            self.stdout.write(f'  - {t.name}')

        team_members = User.objects.filter(team__in=managed_teams)
        self.stdout.write(f'\nTeam members in managed teams: {team_members.count()}')
        for member in team_members:
            self.stdout.write(f'  - {member.username} ({member.role}) in {member.team.name}')

        # Test is_team_member method
        self.stdout.write('\n--- Testing is_team_member method ---')
        for dev in [dev1, dev2]:
            result = manager.is_team_member(dev)
            self.stdout.write(f'Is {dev.username} a team member of {manager.username}? {result}')

        self.stdout.write('\n--- Test Users Created ---')
        self.stdout.write('Manager: testmanager / test123')
        self.stdout.write('Developer1: testdev1 / test123')
        self.stdout.write('Developer2: testdev2 / test123')
        
        self.stdout.write('\nTest complete! Try logging in as testmanager to test the frontend.')