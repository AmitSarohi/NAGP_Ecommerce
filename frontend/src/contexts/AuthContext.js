import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// API service
const authService = {
  // Set up axios defaults
  setupInterceptors: (dispatch, getToken) => {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = getToken();
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
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );
  },

  // Login
  login: async (email, password) => {
    const response = await axios.post(`${process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001'}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await axios.post(`${process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001'}/api/auth/register`, userData);
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await axios.get(`${process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001'}/api/auth/verify`);
    return response.data.user;
  },

  // Update profile
  updateProfile: async (userId, userData) => {
    const response = await axios.put(`${process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001'}/api/users/${userId}`, userData);
    return response.data;
  },
};

// Provider component
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Get token from state
  const getToken = () => state.token;

  // Setup axios interceptors
  useEffect(() => {
    authService.setupInterceptors(dispatch, getToken);
  }, [getToken]);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          const user = await authService.verifyToken();
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: user });
        } catch (error) {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: error.response?.data?.error?.message || 'Failed to load user' });
          localStorage.removeItem('token');
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: null });
      }
    };

    loadUser();
  }, [state.token]);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const { token, user } = await authService.login(email, password);
      
      localStorage.setItem('token', token);
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      toast.success('Login successful!');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const { token, user } = await authService.register(userData);
      
      localStorage.setItem('token', token);
      
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { user, token } });
      toast.success('Registration successful!');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(state.user.userId, userData);
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: updatedUser });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider };
