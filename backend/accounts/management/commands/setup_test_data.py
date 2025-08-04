from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Team

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users and teams for development'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(f'Created admin user: {admin_user.username}')
        else:
            self.stdout.write(f'Admin user already exists: {admin_user.username}')

        # Create manager users
        manager1, created = User.objects.get_or_create(
            username='manager1',
            defaults={
                'email': 'manager1@example.com',
                'role': 'manager'
            }
        )
        if created:
            manager1.set_password('manager123')
            manager1.save()
            self.stdout.write(f'Created manager: {manager1.username}')

        manager2, created = User.objects.get_or_create(
            username='manager2',
            defaults={
                'email': 'manager2@example.com',
                'role': 'manager'
            }
        )
        if created:
            manager2.set_password('manager123')
            manager2.save()
            self.stdout.write(f'Created manager: {manager2.username}')

        # Create teams
        team1, created = Team.objects.get_or_create(
            name='Frontend Team',
            defaults={'manager': manager1}
        )
        if created:
            self.stdout.write(f'Created team: {team1.name} managed by {team1.manager.username}')

        team2, created = Team.objects.get_or_create(
            name='Backend Team',
            defaults={'manager': manager2}
        )
        if created:
            self.stdout.write(f'Created team: {team2.name} managed by {team2.manager.username}')

        # Create developer users
        developers = [
            ('dev1', 'dev1@example.com', team1),
            ('dev2', 'dev2@example.com', team1),
            ('dev3', 'dev3@example.com', team2),
            ('dev4', 'dev4@example.com', team2),
        ]

        for username, email, team in developers:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'developer',
                    'team': team
                }
            )
            if created:
                user.set_password('dev123')
                user.save()
                self.stdout.write(f'Created developer: {user.username} in team {team.name}')
            else:
                # Update team if user exists but not assigned
                if not user.team:
                    user.team = team
                    user.save()
                    self.stdout.write(f'Updated {user.username} team to {team.name}')

        # Debug information
        self.stdout.write('\n--- Debug Information ---')
        
        # Check manager teams
        for manager in [manager1, manager2]:
            managed_teams = manager.managed_teams.all()
            self.stdout.write(f'Manager {manager.username} manages {managed_teams.count()} teams:')
            for team in managed_teams:
                members = team.members.all()
                self.stdout.write(f'  - {team.name}: {members.count()} members')
                for member in members:
                    self.stdout.write(f'    * {member.username} ({member.role})')

        self.stdout.write('\n--- Login Credentials ---')
        self.stdout.write('Admin: admin / admin123')
        self.stdout.write('Manager1: manager1 / manager123')
        self.stdout.write('Manager2: manager2 / manager123')
        self.stdout.write('Developers: dev1, dev2, dev3, dev4 / dev123')
        
        self.stdout.write(self.style.SUCCESS('Test data created successfully!'))