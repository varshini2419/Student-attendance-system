import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || 'https://student-attendance-system-hpw1.onrender.com/api';
if (baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost')) {
  baseUrl = 'https://student-attendance-system-hpw1.onrender.com/api';
}
// Automatically append /api if the user forgot it in their environment variables
if (baseUrl && !baseUrl.endsWith('/api')) {
  // Strip trailing slash if present before appending
  baseUrl = baseUrl.replace(/\/$/, '') + '/api';
}

const API = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
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

export default API;
