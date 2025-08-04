import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const TeamAssignment = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);

  const [teamForm, setTeamForm] = useState({
    name: '',
    manager: ''
  });
  const [assignmentForm, setAssignmentForm] = useState({
    user: '',
    team: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, teamsRes] = await Promise.all([
        axios.get('/accounts/users/'),
        axios.get('/accounts/teams/')
      ]);
      setUsers(usersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/accounts/teams/create/', teamForm);
      setTeamForm({ name: '', manager: '' });
      setShowCreateTeam(false);
      fetchData();
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();
    
    try {
      await axios.patch(`/accounts/users/${assignmentForm.user}/assign-team/`, {
        team: assignmentForm.team
      });
      setAssignmentForm({ user: '', team: '' });
      setShowAssignUser(false);
      fetchData();
      alert('User assigned to team successfully!');
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user to team');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getManagers = () => users.filter(user => user.role === 'manager');
  const getDevelopers = () => users.filter(user => user.role === 'developer');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Team Assignment
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Team Management
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                className="btn-secondary"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-primary"
              >
                Create Team
              </button>
              <button
                onClick={() => setShowAssignUser(true)}
                className="btn-primary"
              >
                Assign User to Team
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Teams Overview */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
            {teams.length === 0 ? (
              <p className="text-gray-500">No teams created yet.</p>
            ) : (
              <div className="grid gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                        <p className="text-gray-600">Manager: {team.manager_name}</p>
                        <p className="text-gray-500 text-sm">Members: {team.member_count}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Created: {new Date(team.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Managers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Managers</h3>
              {getManagers().length === 0 ? (
                <p className="text-gray-500">No managers found.</p>
              ) : (
                <div className="space-y-3">
                  {getManagers().map((manager) => (
                    <div key={manager.id} className="card">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{manager.username}</h4>
                          <p className="text-gray-600 text-sm">{manager.email}</p>
                          <p className="text-gray-500 text-sm">Team: {manager.team_name || 'No team'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(manager.role)}`}>
                          {manager.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Developers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Developers</h3>
              {getDevelopers().length === 0 ? (
                <p className="text-gray-500">No developers found.</p>
              ) : (
                <div className="space-y-3">
                  {getDevelopers().map((developer) => (
                    <div key={developer.id} className="card">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{developer.username}</h4>
                          <p className="text-gray-600 text-sm">{developer.email}</p>
                          <p className="text-gray-500 text-sm">Team: {developer.team_name || 'No team'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(developer.role)}`}>
                          {developer.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Team
            </h3>
            
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager *
                </label>
                <select
                  name="manager"
                  required
                  className="input-field"
                  value={teamForm.manager}
                  onChange={(e) => setTeamForm({ ...teamForm, manager: e.target.value })}
                >
                  <option value="">Select a manager</option>
                  {getManagers().map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.username}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User to Team Modal */}
      {showAssignUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign User to Team
            </h3>
            
            <form onSubmit={handleAssignUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User *
                </label>
                <select
                  name="user"
                  required
                  className="input-field"
                  value={assignmentForm.user}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, user: e.target.value })}
                >
                  <option value="">Select a user</option>
                  {getDevelopers().map((developer) => (
                    <option key={developer.id} value={developer.id}>
                      {developer.username} ({developer.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team *
                </label>
                <select
                  name="team"
                  required
                  className="input-field"
                  value={assignmentForm.team}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, team: e.target.value })}
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} (Manager: {team.manager_name})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Assign to Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignUser(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAssignment; 