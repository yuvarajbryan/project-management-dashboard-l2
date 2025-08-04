import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects and tasks based on user role
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get('/projects/projects/'),
        axios.get('/projects/tasks/')
      ]);

      const projects = projectsRes.data;
      const tasks = tasksRes.data;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const pendingTasks = tasks.filter(task => task.status !== 'done').length;

      setStats({
        projects: projects.length,
        tasks: tasks.length,
        completedTasks,
        pendingTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-red-50">
          <h3 className="text-lg font-semibold text-red-900">Total Projects</h3>
          <p className="text-3xl font-bold text-red-600">{stats.projects}</p>
        </div>
        <div className="card bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-900">Total Tasks</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.tasks}</p>
        </div>
        <div className="card bg-green-50">
          <h3 className="text-lg font-semibold text-green-900">Completed Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="card bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-900">Pending Tasks</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingTasks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Admin Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/users')}
              className="btn-primary w-full"
            >
              Manage Users
            </button>
            <button 
              onClick={() => navigate('/team-assignment')}
              className="btn-primary w-full"
            >
              Team Assignment
            </button>
            <button 
              onClick={() => navigate('/projects')}
              className="btn-primary w-full"
            >
              Create Projects
            </button>
            <button 
              onClick={() => alert('Audit Logs feature would open here. For now, going to users.')}
              className="btn-primary w-full"
            >
              View Audit Logs
            </button>
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <p>• You have access to all projects and tasks</p>
            <p>• Can manage user roles and permissions</p>
            <p>• Full system administration capabilities</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManagerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-900">My Team</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.projects}</p>
        </div>
        <div className="card bg-green-50">
          <h3 className="text-lg font-semibold text-green-900">Team Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{stats.tasks}</p>
        </div>
        <div className="card bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingTasks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Manager Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/team')}
              className="btn-primary w-full"
            >
              View My Team
            </button>
            <button 
              onClick={() => navigate('/team')}
              className="btn-primary w-full"
            >
              Assign Tasks
            </button>
            <button 
              onClick={() => navigate('/tasks')}
              className="btn-primary w-full"
            >
              View Team Tasks
            </button>
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Team Management</h3>
          <div className="space-y-2 text-sm">
            <p>• View your team members</p>
            <p>• Assign tasks to team members only</p>
            <p>• Monitor team progress</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeveloperDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-green-50">
          <h3 className="text-lg font-semibold text-green-900">My Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{stats.tasks}</p>
        </div>
        <div className="card bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-900">Completed</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.completedTasks}</p>
        </div>
        <div className="card bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-900">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingTasks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Developer Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/tasks')}
              className="btn-primary w-full"
            >
              View My Tasks
            </button>
            <button 
              onClick={() => navigate('/timelog')}
              className="btn-primary w-full"
            >
              Log Time
            </button>
            <button 
              onClick={() => navigate('/tasks')}
              className="btn-primary w-full"
            >
              Update Status
            </button>
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Task Management</h3>
          <div className="space-y-2 text-sm">
            <p>• View and update your assigned tasks</p>
            <p>• Log time spent on tasks</p>
            <p>• Update task status and progress</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return renderAdminDashboard();
      case 'manager':
        return renderManagerDashboard();
      case 'developer':
        return renderDeveloperDashboard();
      default:
        return renderDeveloperDashboard();
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
                Project Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                {user?.role?.toUpperCase()}
              </span>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary text-sm"
              >
                Home
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === 'admin' ? 'Admin Dashboard' :
               user?.role === 'manager' ? 'Manager Dashboard' : 'Developer Dashboard'}
            </h2>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.username}! Here's your project overview.
            </p>
          </div>

          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 