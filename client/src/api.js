// src/api.js
import axios from 'axios';

// Production environment - directly use Railway backend
const API_BASE_URL = 'https://aidiy-deployment-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('app_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export the base URL for direct fetch calls
export { API_BASE_URL };
export default api;
