import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { User, AuthResponse, LoginData, RegisterData, AuthContextType, AppError } from '../types';
import { config } from '../lib/config';
import { apiClient } from '../lib/api';
import { storage } from '../lib/storage';

// Initial state
const initialState: AuthContextType = {
  user: null,
  builder: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshAccessToken: async () => {},
};

// Action types
type AuthAction =
  | { type: 'AUTH_START_LOADING' }
  | { type: 'AUTH_STOP_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; builder?: any } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: Partial<User> };

// Reducer
const authReducer = (state: AuthContextType, action: AuthAction): AuthContextType => {
  switch (action.type) {
    case 'AUTH_START_LOADING':
      return {
        ...state,
        isLoading: true,
      };

    case 'AUTH_STOP_LOADING':
      return {
        ...state,
        isLoading: false,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        builder: action.payload.builder || state.builder,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        builder: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        builder: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType>(initialState);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = storage.getAccessToken();
        const refreshToken = storage.getRefreshToken();
        const user = storage.getUser();
        const builder = storage.getBuilder();

        if (token && user) {
          // Validate token
          try {
            const response = await apiClient.post('/auth/validate', { token });
            if (response.data.user) {
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user: response.data.user,
                  builder: builder || response.data.builder,
                },
              });
              return;
            }
          } catch (error) {
            // Token is invalid, try to refresh
            if (refreshToken) {
              try {
                await refreshAccessToken(refreshToken);
                return;
              } catch (refreshError) {
                // Refresh failed, clear everything
                console.error('Token refresh failed:', refreshError);
              }
            }
          }
        }

        // No valid auth, clear storage
        storage.clearAuth();
        dispatch({ type: 'AUTH_LOGOUT' });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        storage.clearAuth();
        dispatch({ type: 'AUTH_LOGOUT' });
      } finally {
        dispatch({ type: 'AUTH_STOP_LOADING' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (data: LoginData): Promise<void> => {
    dispatch({ type: 'AUTH_START_LOADING' });

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      storage.setAccessToken(accessToken);
      storage.setRefreshToken(refreshToken);
      storage.setUser(user);

      // Get builder info if not included
      let builder = response.data.builder;
      if (!builder && user) {
        try {
          const builderResponse = await apiClient.get(`/builders/${user.builderId}`);
          builder = builderResponse.data;
          storage.setBuilder(builder);
        } catch (error) {
          console.error('Failed to fetch builder info:', error);
        }
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, builder },
      });

      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
      const err = error as AxiosError<AppError>;
      const message = err.response?.data?.error?.message || 'Login failed';

      dispatch({
        type: 'AUTH_FAILURE',
        payload: message,
      });

      toast.error(message);
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: 'AUTH_START_LOADING' });

    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      storage.setAccessToken(accessToken);
      storage.setRefreshToken(refreshToken);
      storage.setUser(user);

      // Get builder info if not included
      let builder = response.data.builder;
      if (!builder && user) {
        try {
          const builderResponse = await apiClient.get(`/builders/${user.builderId}`);
          builder = builderResponse.data;
          storage.setBuilder(builder);
        } catch (error) {
          console.error('Failed to fetch builder info:', error);
        }
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, builder },
      });

      toast.success(`Welcome to Xavira, ${user.name}!`);
    } catch (error) {
      const err = error as AxiosError<AppError>;
      const message = err.response?.data?.error?.message || 'Registration failed';

      dispatch({
        type: 'AUTH_FAILURE',
        payload: message,
      });

      toast.error(message);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate refresh token
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear storage regardless of API call success
      storage.clearAuth();
      dispatch({ type: 'AUTH_LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Refresh access token
  const refreshAccessToken = async (refreshToken?: string): Promise<void> => {
    try {
      const token = refreshToken || storage.getRefreshToken();
      if (!token) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update stored tokens
      storage.setAccessToken(accessToken);
      if (newRefreshToken) {
        storage.setRefreshToken(newRefreshToken);
      }

      // Update user info
      const user = storage.getUser();
      if (user) {
        try {
          const userResponse = await apiClient.get<User>('/auth/me');
          storage.setUser(userResponse.data);
          dispatch({
            type: 'AUTH_UPDATE_USER',
            payload: userResponse.data,
          });
        } catch (error) {
          console.error('Failed to refresh user info:', error);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      storage.clearAuth();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  // Update user function
  const updateUser = (userData: Partial<User>): void => {
    const updatedUser = state.user ? { ...state.user, ...userData } : null;
    if (updatedUser) {
      storage.setUser(updatedUser);
      dispatch({
        type: 'AUTH_UPDATE_USER',
        payload: userData,
      });
    }
  };

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        const token = storage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshAccessToken();
            const token = storage.getAccessToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            storage.clearAuth();
            dispatch({ type: 'AUTH_LOGOUT' });
            toast.error('Session expired. Please login again.');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAccessToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;