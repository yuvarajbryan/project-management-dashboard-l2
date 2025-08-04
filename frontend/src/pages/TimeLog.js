import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const TimeLog = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [logForm, setLogForm] = useState({
    hours: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching tasks and time logs...');
      
      const [tasksRes, logsRes] = await Promise.all([
        axios.get('/projects/tasks/'),
        axios.get('/timelogs/')
      ]);
      
      console.log('Tasks response:', tasksRes.data);
      console.log('Time logs response:', logsRes.data);
      
      // Ensure data is arrays
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const logsData = Array.isArray(logsRes.data) ? logsRes.data : [];
      
      setTasks(tasksData);
      setTimeLogs(logsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      let errorMessage = 'Failed to load data';
      if (error.response) {
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data?.detail || `HTTP ${error.response.status}: ${error.response.statusText}`;
      }
      
      setError(errorMessage);
      // Set empty arrays on error
      setTasks([]);
      setTimeLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if a task has already been logged by the current user
  const isTaskLogged = (taskId) => {
    if (!Array.isArray(timeLogs)) {
      console.warn('timeLogs is not an array:', timeLogs);
      return false;
    }
    return timeLogs.some(log => log.task === taskId);
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await axios.post('/timelogs/', {
        task: selectedTask.id,
        hours: parseFloat(logForm.hours),
        description: logForm.description
      });
      
      setLogForm({ hours: '', description: '' });
      setShowLogForm(false);
      setSelectedTask(null);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error logging time:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to log time. You may have already logged time for this task.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openLogForm = (task) => {
    // Don't open form if task is already logged
    if (isTaskLogged(task.id)) {
      alert('You have already logged time for this task.');
      return;
    }
    setSelectedTask(task);
    setShowLogForm(true);
  };

  const closeLogForm = () => {
    setShowLogForm(false);
    setSelectedTask(null);
    setLogForm({ hours: '', description: '' });
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
                Time Logging
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username} ({user?.role})
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
              Log Time for Tasks
            </h2>
            <button
              onClick={fetchData}
              className="btn-primary"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Available Tasks */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tasks</h3>
            {!Array.isArray(tasks) || tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks available.</p>
                {!Array.isArray(tasks) && (
                  <p className="text-red-500 text-sm mt-2">
                    Invalid tasks data received from server.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="card">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Status: <span className="capitalize">{task.status}</span>
                        </p>
                      </div>
                      {isTaskLogged(task.id) ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 text-sm font-medium">
                            ✓ Time Logged
                          </span>
                          <button
                            onClick={() => openLogForm(task)}
                            className="btn-secondary text-sm"
                            disabled
                          >
                            Already Logged
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openLogForm(task)}
                          className="btn-primary text-sm"
                        >
                          Log Time
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Time Logs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Time Logs</h3>
            {!Array.isArray(timeLogs) || timeLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No time logs found.</p>
                {!Array.isArray(timeLogs) && (
                  <p className="text-red-500 text-sm mt-2">
                    Invalid time logs data received from server.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {timeLogs.map((log) => (
                  <div key={log.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{log.task_title || 'Unknown Task'}</h4>
                        <p className="text-gray-600 text-sm">{log.description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-primary-600">
                          {log.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Time Log Modal */}
      {showLogForm && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Log Time for: {selectedTask.title}
            </h3>
            
            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  className="input-field"
                  value={logForm.hours}
                  onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                  placeholder="e.g., 2.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Log Time
                </button>
                <button
                  type="button"
                  onClick={closeLogForm}
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

export default TimeLog;