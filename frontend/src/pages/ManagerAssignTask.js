import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ManagerAssignTask = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [targetUser, setTargetUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project: '',
    due_date: '',
    status: 'todo'
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // First check if the user exists and get their details
      const userRes = await axios.get(`/accounts/users/${userId}/`);
      if (!userRes.data) {
        throw new Error('User not found');
      }
      setTargetUser(userRes.data);

      // Then get the manager's team members
      const teamRes = await axios.get('/accounts/manager/team/');
      const teamMembers = teamRes.data;
      
      // Check if the target user is in the manager's team
      const isTeamMember = teamMembers.some(member => member.id === parseInt(userId));
      if (!isTeamMember) {
        throw new Error('This user is not in your team');
      }

      // Finally get the projects
      const projectsRes = await axios.get('/projects/projects/');
      if (!projectsRes.data) {
        throw new Error('No projects found');
      }
      setProjects(projectsRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to perform this action');
      } else if (error.response?.status === 404) {
        setError('User not found');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to load data. Please try again.');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskForm.project) {
      alert('Please select a project');
      return;
    }
    
    try {
      const formData = {
        title: taskForm.title,
        description: taskForm.description || '',
        project: parseInt(taskForm.project),
        assigned_to: parseInt(userId),
        status: taskForm.status
      };

      if (taskForm.due_date) {
        formData.due_date = taskForm.due_date;
      }

      console.log('Sending task data:', formData); // Debug log

      const response = await axios.post('/projects/tasks/', formData);
      
      if (response.data) {
        alert('Task assigned successfully!');
        navigate('/team');
      }
    } catch (error) {
      console.error('Error assigning task:', error.response || error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else if (error.response?.data) {
        // Handle field-specific errors
        const errors = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        alert(`Failed to assign task:\n${errors}`);
      } else {
        alert('Failed to assign task. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChange = (e) => {
    setTaskForm({
      ...taskForm,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/team')}
            className="btn-primary"
          >
            Back to My Team
          </button>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">User not found.</p>
          <button
            onClick={() => navigate('/team')}
            className="btn-primary mt-4"
          >
            Back to My Team
          </button>
        </div>
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
                Assign Task to Team Member
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username}
              </span>
              <button
                onClick={() => navigate('/team')}
                className="btn-secondary text-sm"
              >
                Back to My Team
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Assign Task to {targetUser.username}
            </h2>
            <p className="text-gray-600">
              Create a new task and assign it to your team member {targetUser.username}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="input-field"
                    value={taskForm.title}
                    onChange={handleChange}
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    name="project"
                    required
                    className="input-field"
                    value={taskForm.project}
                    onChange={handleChange}
                  >
                    <option value="">Select a project</option>
                    {Array.isArray(projects) && projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  className="input-field"
                  value={taskForm.description}
                  onChange={handleChange}
                  placeholder="Describe the task in detail"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    className="input-field"
                    value={taskForm.due_date}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    className="input-field"
                    value={taskForm.status}
                    onChange={handleChange}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Assign Task
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/team')}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* User Info Card */}
          <div className="mt-6 card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Team Member Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{targetUser.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{targetUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{targetUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerAssignTask;