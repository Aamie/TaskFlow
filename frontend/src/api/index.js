import axios from 'axios';

// ⚠️ Change this to your Railway backend URL after deploying
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const signup = (name, email, password, role) => api.post('/auth/signup', { name, email, password, role });
export const getMe = () => api.get('/auth/me');

// Projects
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addProjectMember = (id, userId) => api.post(`/projects/${id}/members`, { userId });
export const removeProjectMember = (id, userId) => api.delete(`/projects/${id}/members/${userId}`);

// Tasks
export const getTasks = (params) => api.get('/tasks', { params });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Users
export const getUsers = () => api.get('/users');
export const getMembers = () => api.get('/users/members');
export const updateUserRole = (id, role) => api.put(`/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/users/${id}`);

export default api;
