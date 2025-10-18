import axios from 'axios';
import Cookies from 'js-cookie';

// ✅ Dynamic base URL for deployment flexibility
const getBaseURL = () => {
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
