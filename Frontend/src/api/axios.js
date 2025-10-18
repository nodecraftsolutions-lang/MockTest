import axios from 'axios';
import Cookies from 'js-cookie';

// ✅ Dynamic base URL for deployment flexibility
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // In browser, try to detect backend URL
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://mocktest-bckx.onrender.com/api/v1';
    }
    // For production, assume backend is on same domain with /api prefix
    return `${window.location.protocol}//${hostname}/api/v1`;
  }
  return 'https://mocktest-bckx.onrender.com/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
