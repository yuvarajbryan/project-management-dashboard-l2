import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const TeamManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/accounts/manager/team/');
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
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
                My Team
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
              Team Members
            </h2>
            <button
              onClick={fetchTeamMembers}
              className="btn-primary"
            >
              Refresh Team
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No team members found.</p>
              <p className="text-gray-400 text-sm mt-2">
                Contact your admin to assign team members to you.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="card">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.username}
                          </h3>
                          <p className="text-gray-600">{member.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {member.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                                             <button
                         onClick={() => navigate(`/manager-assign-task/${member.id}`)}
                         className="btn-primary text-sm"
                       >
                         Assign Task
                       </button>
                      <button
                        onClick={() => navigate(`/member-tasks/${member.id}`)}
                        className="btn-secondary text-sm"
                      >
                        View Tasks
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team Stats */}
          {teamMembers.length > 0 && (
            <div className="mt-8 card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {teamMembers.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {teamMembers.filter(m => m.role === 'developer').length}
                  </p>
                  <p className="text-sm text-gray-600">Developers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {teamMembers.filter(m => m.role === 'manager').length}
                  </p>
                  <p className="text-sm text-gray-600">Managers</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamManagement; 