import axios, { AxiosError } from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5245',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request: attach JWT ──────────────────────────────────────────────────────

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: handle errors ──────────────────────────────────────────────────

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 — token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Network error — backend unreachable
    if (!error.response) {
      return Promise.reject(
        new Error('Cannot reach the server. Please ensure the backend is running on http://localhost:5245')
      );
    }

    // 403 — forbidden
    if (error.response.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }

    // 429 — rate limited
    if (error.response.status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'));
    }

    // 500+ — server error, surface the backend detail message if available
    if (error.response.status >= 500) {
      const detail = (error.response.data as any)?.detail || 'An unexpected server error occurred.';
      return Promise.reject(new Error(detail));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
