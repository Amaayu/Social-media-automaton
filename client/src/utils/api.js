import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data.error || 'Bad request';
          break;
        case 401:
          error.message = 'Unauthorized. Please login again.';
          // Redirect to login on 401
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 404:
          error.message = 'Resource not found';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = data.error || 'An error occurred';
      }
    } else if (error.request) {
      // Request made but no response received
      error.message = 'Network error. Please check your connection.';
    } else {
      // Something else happened
      error.message = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const configAPI = {
  saveInstagramConfig: (data) => api.post('/config/instagram', data),
  getInstagramConfig: () => api.get('/config/instagram'),
  deleteInstagramConfig: () => api.delete('/config/instagram'),
  saveTone: (tone) => api.post('/config/tone', { tone }),
  getTone: () => api.get('/config/tone'),
  validateApiKey: (apiKey) => api.post('/config/validate-api-key', { apiKey }),
};

export const automationAPI = {
  start: () => api.post('/automation/start'),
  stop: () => api.post('/automation/stop'),
  getStatus: () => api.get('/automation/status'),
};

export const logsAPI = {
  getLogs: (params) => api.get('/logs', { params }),
  exportLogs: () => api.get('/logs/export'),
  clearLogs: () => api.delete('/logs'),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
