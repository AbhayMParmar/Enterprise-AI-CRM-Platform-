import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends cookies (e.g. Refresh Token) with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && token !== 'session-active' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401s, silently refresh access token, and retry request
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // These endpoints should never trigger a refresh-token retry
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/me') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/google-login');

    // Check if error is 401 (Unauthorized), not an auth probing route, and has not been retried already
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request token refresh using the HttpOnly cookie
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken, user } = response.data;

        // Update store with new credentials
        useAuthStore.getState().login(accessToken, user);

        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh token failed (expired, invalid, or revoked)
        processQueue(refreshError, null);
        isRefreshing = false;

        // Log out user only if they were authenticated
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
