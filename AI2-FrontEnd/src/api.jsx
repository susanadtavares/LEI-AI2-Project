import axios from 'axios';
import Authentication from './Auth.service';

// Fallback URL if environment variable is not set
const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  /*headers: {
    'Content-Type': 'application/json',
  },*/
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token); // Debug log
  if (token) {
    config.headers['Authorization'] = `Bearer ${token.replace(/^"|"$/g, '')}`
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const newToken = await Authentication.refreshAccessToken();
      originalRequest.headers['Authorization'] = `Bearer ${newToken.replace(/^"|"$/g, '')}`
      return api(originalRequest);
    } catch (err) {
      Authentication.logout();
      return Promise.reject(err);
    }
  }
  return Promise.reject(error);
});

export default api;