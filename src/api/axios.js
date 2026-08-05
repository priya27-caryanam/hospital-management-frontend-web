/**
 * Axios Instance with Interceptors
 * Automatically attaches Bearer JWT Token to every outgoing HTTP request
 */
import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  let token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (token && token !== 'undefined' && token !== 'null') {
    token = token.replace(/^"(.*)"$/, '$1');
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', authHeader);
    }
    if (config.headers) {
      config.headers['Authorization'] = authHeader;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const method = (error.config?.method || 'get').toLowerCase();
    const skipToast = error.config?.skipToast403 || error.config?.headers?.['X-Suppress-Toast'];

    if (status === 401) {
      console.warn(`401 Unauthorized for URL: ${url}`);
      if (!url.includes('/auth/login')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/home';
      }
    } else if (status === 403) {
      console.warn(`403 Forbidden for URL: ${url}`);
      // Only show global toast for mutating actions (POST/PUT/DELETE) if not explicitly suppressed
      if (method !== 'get' && !skipToast) {
        toast.error('Access Denied (403): Action restricted by server policy.');
      }
    } else if (status === 500) {
      console.error(`500 Server Error for URL: ${url}`, error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;