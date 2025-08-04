import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quickStats, setQuickStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(false);

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

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get('/projects/projects/'),
        axios.get('/projects/tasks/')
      ]);
      
      const projects = projectsRes.data;
      const tasks = tasksRes.data;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      
      setQuickStats({
        projects: projects.length,
        tasks: tasks.length,
        completedTasks
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const handleViewProjects = () => {
    navigate('/dashboard');
    // In a real app, you might navigate to a specific projects page
  };

  const handleViewTasks = () => {
    navigate('/tasks');
    // Now navigates to the dedicated tasks page
  };

  const handleCreateProject = () => {
    // For now, navigate to dashboard. In a real app, this would open a modal or new page
    alert('Create Project feature would open here. For now, going to dashboard.');
    navigate('/dashboard');
  };

  const handleManageUsers = () => {
    navigate('/users');
  };

  const handleCreateProjects = () => {
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Project Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.username}
              </span>
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
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to Your Dashboard
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  User Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Username:</span> {user?.username}</p>
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Role:</span> {user?.role}</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleViewProjects}
                    className="btn-primary w-full text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'View Projects'}
                  </button>
                  <button
                    onClick={handleViewTasks}
                    className="btn-primary w-full text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'View Tasks'}
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleCreateProjects}
                      className="btn-secondary w-full text-sm"
                      disabled={loading}
                    >
                      Create Projects
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleManageUsers}
                      className="btn-secondary w-full text-sm"
                      disabled={loading}
                    >
                      Manage Users
                    </button>
                  )}
                  {user?.role === 'manager' && (
                    <button
                      onClick={() => navigate('/team')}
                      className="btn-secondary w-full text-sm"
                      disabled={loading}
                    >
                      View My Team
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Quick Stats
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between">
                    <span>Total Projects:</span>
                    <span className="font-semibold">{loading ? '...' : quickStats.projects}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Total Tasks:</span>
                    <span className="font-semibold">{loading ? '...' : quickStats.tasks}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold text-green-600">{loading ? '...' : quickStats.completedTasks}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary text-lg px-8 py-3"
                >
                  Access Full Dashboard
                </button>
                <button
                  onClick={fetchQuickStats}
                  disabled={loading}
                  className="btn-secondary text-lg px-8 py-3"
                >
                  {loading ? 'Refreshing...' : 'Refresh Stats'}
                </button>
              </div>
              {loading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home; 