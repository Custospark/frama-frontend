import axios, { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT, UPLOAD_TIMEOUT } from './apiConfig';

const TOKEN_KEY = 'frama_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { Accept: 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      const headers = config.headers ? AxiosHeaders.from(config.headers) : new AxiosHeaders();
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }

    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData) {
      (config.headers as AxiosHeaders)?.delete?.('Content-Type');
      // File uploads (report attachments, asset photos) can be large; the
      // default 60s budget aborts them on slow connections.
      config.timeout = UPLOAD_TIMEOUT;
    } else {
      const method = (config.method || 'get').toLowerCase();
      const hasBody = ['post', 'put', 'patch', 'delete'].includes(method);
      if (hasBody && config.data !== undefined) {
        (config.headers as AxiosHeaders)?.set?.('Content-Type', 'application/json');
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isHandling401 = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = String(error.config?.url ?? '');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/change-pin');

    if (error.response?.status === 401 && !isAuthEndpoint && !isHandling401) {
      isHandling401 = true;
      setStoredToken(null);
      window.location.replace('/login');
      setTimeout(() => { isHandling401 = false; }, 3000);
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
export default axiosInstance;
