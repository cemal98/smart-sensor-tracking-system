import axios, { AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { handleUnauthorized } from '../utils/handleUnauthorized';

export interface ApiRequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
}

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000/api";

const defaultOptions: ApiRequestConfig = {
  requiresAuth: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};

const api = axios.create({
  baseURL: BASE_URL,
  ...defaultOptions,
});

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('token');
};

api.interceptors.request.use(
  (config) => {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = AxiosHeaders.from(config.headers as any);
    }

    const customConfig = config as ApiRequestConfig;

    if (customConfig.requiresAuth !== false) {
      const token = getToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export const getRequest = async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

export const postRequest = async <T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

export const putRequest = async <T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> => {
  const response = await api.put<T>(url, data, config);
  return response.data;
};

export const patchRequest = async <T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> => {
  const response = await api.patch<T>(url, data, config);
  return response.data;
};

export const deleteRequest = async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

// API client
const apiClient = {
  get: getRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
  setAuthToken: setToken,
  getAuthToken: getToken,
  removeAuthToken: removeToken
};

export default apiClient;