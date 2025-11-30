import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { config, HTTP_STATUS, API_ENDPOINTS } from './config';
import { ApiResponse } from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xavira_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // Handle 401 Unauthorized
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the access token
        const refreshToken = localStorage.getItem('xavira_refresh_token');
        if (refreshToken) {
          const refreshResponse = await apiClient.post('/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

          // Update stored tokens
          localStorage.setItem('xavira_access_token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('xavira_refresh_token', newRefreshToken);
          }

          // Update original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Retry original request
          return apiClient(originalRequest);
        } else {
          // No refresh token, redirect to login
          handleAuthError();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        handleAuthError();
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
      toast.error('You do not have permission to perform this action.');
    }

    // Handle 404 Not Found
    if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
      toast.error('The requested resource was not found.');
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      toast.error('Too many requests. Please try again later.');
    }

    // Handle 500+ Server Errors
    if (error.response?.status && error.response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      toast.error('Server error. Please try again later.');
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
    }

    return Promise.reject(error);
  }
);

// Generate unique request ID
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// Handle authentication errors
const handleAuthError = (): void => {
  // Clear stored auth data
  localStorage.removeItem('xavira_access_token');
  localStorage.removeItem('xavira_refresh_token');
  localStorage.removeItem('xavira_user');
  localStorage.removeItem('xavira_builder');

  // Redirect to login if not already there
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }

  toast.error('Session expired. Please login again.');
};

// API wrapper functions
export const api = {
  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload
  async upload<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (config?.onUploadProgress) {
          config.onUploadProgress(progressEvent);
        }
      },
    };

    try {
      const response = await apiClient.post<ApiResponse<T>>(url, formData, uploadConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Multiple file upload
  async uploadMultiple<T = any>(url: string, files: File[], config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (config?.onUploadProgress) {
          config.onUploadProgress(progressEvent);
        }
      },
    };

    try {
      const response = await apiClient.post<ApiResponse<T>>(url, formData, uploadConfig);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    try {
      const response = await apiClient.get(url, {
        ...config,
        responseType: 'blob',
      });

      // Create blob URL
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);

      // Create temporary link and click it
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      throw error;
    }
  },

  // Cancel request
  cancelRequest: (message?: string) => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    if (message) {
      source.cancel(message);
    }

    return {
      token: source.token,
      cancel: source.cancel,
    };
  },

  // Check if request was cancelled
  isCancel: axios.isCancel,
};

// Specific API endpoint helpers
export const authApi = {
  login: (data: any) => api.post(API_ENDPOINTS.AUTH.LOGIN, data),
  register: (data: any) => api.post(API_ENDPOINTS.AUTH.REGISTER, data),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  refresh: (data: any) => api.post(API_ENDPOINTS.AUTH.REFRESH, data),
  me: () => api.get(API_ENDPOINTS.AUTH.ME),
  changePassword: (data: any) => api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
  forgotPassword: (data: any) => api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data),
  resetPassword: (data: any) => api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),
  validate: (data: any) => api.post(API_ENDPOINTS.AUTH.VALIDATE, data),
};

export const usersApi = {
  list: (params?: any) => api.get(API_ENDPOINTS.USERS.LIST, { params }),
  create: (data: any) => api.post(API_ENDPOINTS.USERS.CREATE, data),
  get: (id: string) => api.get(API_ENDPOINTS.USERS.GET(id)),
  update: (id: string, data: any) => api.patch(API_ENDPOINTS.USERS.UPDATE(id), data),
  delete: (id: string) => api.delete(API_ENDPOINTS.USERS.DELETE(id)),
  stats: (id: string) => api.get(API_ENDPOINTS.USERS.STATS(id)),
  teamPerformance: () => api.get(API_ENDPOINTS.USERS.TEAM_PERFORMANCE),
  resetPassword: (id: string, data: any) => api.post(API_ENDPOINTS.USERS.RESET_PASSWORD(id), data),
  toggleStatus: (id: string) => api.patch(API_ENDPOINTS.USERS.TOGGLE_STATUS(id)),
  bulkUpdateStatus: (data: any) => api.patch(API_ENDPOINTS.USERS.BULK_STATUS, data),
  bulkDelete: (data: any) => api.delete(API_ENDPOINTS.USERS.BULK_DELETE, { data }),
};

export const projectsApi = {
  list: (params?: any) => api.get(API_ENDPOINTS.PROJECTS.LIST, { params }),
  create: (data: any) => api.post(API_ENDPOINTS.PROJECTS.CREATE, data),
  get: (id: string) => api.get(API_ENDPOINTS.PROJECTS.GET(id)),
  update: (id: string, data: any) => api.patch(API_ENDPOINTS.PROJECTS.UPDATE(id), data),
  delete: (id: string) => api.delete(API_ENDPOINTS.PROJECTS.DELETE(id)),
};

export const leadsApi = {
  list: (params?: any) => api.get(API_ENDPOINTS.LEADS.LIST, { params }),
  create: (data: any) => api.post(API_ENDPOINTS.LEADS.CREATE, data),
  get: (id: string) => api.get(API_ENDPOINTS.LEADS.GET(id)),
  update: (id: string, data: any) => api.patch(API_ENDPOINTS.LEADS.UPDATE(id), data),
  delete: (id: string) => api.delete(API_ENDPOINTS.LEADS.DELETE(id)),
  activities: (id: string, params?: any) => api.get(API_ENDPOINTS.LEADS.ACTIVITIES(id), { params }),
  moveStage: (id: string, data: any) => api.post(API_ENDPOINTS.LEADS.MOVE_STAGE(id), data),
};

export const pipelineApi = {
  stages: () => api.get(API_ENDPOINTS.PIPELINE.STAGES),
  board: (params?: any) => api.get(API_ENDPOINTS.PIPELINE.BOARD, { params }),
  move: (data: any) => api.post(API_ENDPOINTS.PIPELINE.MOVE, data),
};

export const automationApi = {
  sequences: {
    list: (params?: any) => api.get(API_ENDPOINTS.AUTOMATION.SEQUENCES, { params }),
    create: (data: any) => api.post(API_ENDPOINTS.AUTOMATION.CREATE_SEQUENCE, data),
    get: (id: string) => api.get(API_ENDPOINTS.AUTOMATION.GET_SEQUENCE(id)),
    update: (id: string, data: any) => api.patch(API_ENDPOINTS.AUTOMATION.UPDATE_SEQUENCE(id), data),
    delete: (id: string) => api.delete(API_ENDPOINTS.AUTOMATION.DELETE_SEQUENCE(id)),
    preview: (id: string, data: any) => api.post(API_ENDPOINTS.AUTOMATION.PREVIEW_SEQUENCE(id), data),
  },
};

export const templatesApi = {
  list: (params?: any) => api.get(API_ENDPOINTS.TEMPLATES.LIST, { params }),
  create: (data: any) => api.post(API_ENDPOINTS.TEMPLATES.CREATE, data),
  get: (id: string) => api.get(API_ENDPOINTS.TEMPLATES.GET(id)),
  update: (id: string, data: any) => api.patch(API_ENDPOINTS.TEMPLATES.UPDATE(id), data),
  delete: (id: string) => api.delete(API_ENDPOINTS.TEMPLATES.DELETE(id)),
  preview: (id: string, data: any) => api.post(API_ENDPOINTS.TEMPLATES.PREVIEW(id), data),
};

export const whatsappApi = {
  config: () => api.get(API_ENDPOINTS.WHATSAPP.CONFIG),
  updateConfig: (data: any) => api.post(API_ENDPOINTS.WHATSAPP.CONFIG, data),
  send: (data: any) => api.post(API_ENDPOINTS.WHATSAPP.SEND, data),
  sendBulk: (data: any) => api.post(API_ENDPOINTS.WHATSAPP.SEND_BULK, data),
  logs: (params?: any) => api.get(API_ENDPOINTS.WHATSAPP.LOGS, { params }),
};

export const dashboardApi = {
  summary: () => api.get(API_ENDPOINTS.DASHBOARD.SUMMARY),
  metrics: (params?: any) => api.get(API_ENDPOINTS.DASHBOARD.METRICS, { params }),
  timeline: (params?: any) => api.get(API_ENDPOINTS.DASHBOARD.TIMELINE, { params }),
};

export const publicApi = {
  leadWebhook: (data: any) => api.post(API_ENDPOINTS.PUBLIC.LEAD_WEBHOOK, data),
  whatsappWebhook: (data: any) => api.post(API_ENDPOINTS.PUBLIC.WHATSAPP_WEBHOOK, data),
};

export const utilityApi = {
  health: () => api.get(API_ENDPOINTS.HEALTH),
  docs: () => api.get(API_ENDPOINTS.DOCS),
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isValidationError = (error: any): boolean => {
  return error.response?.data?.error?.code === 'VALIDATION_ERROR';
};

export const getValidationErrors = (error: any): Array<{ field: string; message: string; value?: any }> => {
  return error.response?.data?.error?.details || [];
};

// Check for network connectivity
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    await utilityApi.health();
    return true;
  } catch {
    return false;
  }
};

// Export the API client instance
export default apiClient;