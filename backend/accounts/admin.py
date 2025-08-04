from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Team

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'team', 'get_managed_teams', 'is_staff', 'is_active')
    list_filter = ('role', 'team', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Team', {'fields': ('role', 'team')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role & Team', {'fields': ('role', 'team')}),
    )
    
    def get_managed_teams(self, obj):
        if obj.role == 'manager':
            teams = obj.managed_teams.all()
            return ', '.join([team.name for team in teams]) if teams else 'No teams'
        return '-'
    get_managed_teams.short_description = 'Manages Teams'

class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'get_member_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'manager__username')
    
    def get_member_count(self, obj):
        return obj.members.count()
    get_member_count.short_description = 'Members Count'
    
    def get_readonly_fields(self, request, obj=None):
        # Show team members in the admin interface
        if obj:
            return self.readonly_fields + ('get_team_members',)
        return self.readonly_fields
    
    def get_team_members(self, obj):
        if obj:
            members = obj.members.all()
            if members:
                return ', '.join([f"{member.username} ({member.role})" for member in members])
            return "No members assigned"
        return "Save team first"
    get_team_members.short_description = 'Team Members'

# Register your models here.
admin.site.register(User, CustomUserAdmin)
admin.site.register(Team, TeamAdmin)