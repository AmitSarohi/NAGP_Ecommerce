import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const BASE_URL = '/api';

/* =========================
   Initial State
========================= */
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/* =========================
   Reducer
========================= */
const AUTH_ACTIONS = {
  START: 'START',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.START:
      return { ...state, isLoading: true, error: null };

    case AUTH_ACTIONS.SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token ?? state.token,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.FAILURE:
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
      return { ...state, error: null };

    default:
      return state;
  }
};

/* =========================
   Axios Setup (ONE TIME)
========================= */
let interceptorsInitialized = false;

const setupInterceptors = (getToken, dispatch) => {
  if (interceptorsInitialized) return;
  interceptorsInitialized = true;

  axios.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        toast.error('Session expired. Please login again.');
      }
      return Promise.reject(error);
    }
  );
};

/* =========================
   Helper: Decode Role
========================= */
const extractRoleFromToken = (token) => {
  if (!token || !token.includes('.')) return null;

  try {
    const base64 = token.split('.')[1];
    const decoded = JSON.parse(atob(base64));
    return decoded.role || 'user';
  } catch {
    return 'user';
  }
};

/* =========================
   Provider
========================= */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /* Stable token getter */
  const getToken = useCallback(() => state.token, [state.token]);

  /* Setup interceptors ONCE */
  useEffect(() => {
    setupInterceptors(getToken, dispatch);
  }, [getToken]);

  /* Load user on app start */
  useEffect(() => {
    const loadUser = async () => {
      if (!state.token) {
        dispatch({ type: AUTH_ACTIONS.SUCCESS, payload: { user: null } });
        return;
      }

      try {
        dispatch({ type: AUTH_ACTIONS.START });

        const res = await axios.get(`${BASE_URL}/auth/verify`);

        dispatch({
          type: AUTH_ACTIONS.SUCCESS,
          payload: { user: res.data.user },
        });
      } catch (err) {
        localStorage.removeItem('token');
        dispatch({
          type: AUTH_ACTIONS.FAILURE,
          payload: 'Session invalid',
        });
      }
    };

    loadUser();
  }, [state.token]);

  /* =========================
     Actions (Memoized)
  ========================= */

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.START });

      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);

      dispatch({
        type: AUTH_ACTIONS.SUCCESS,
        payload: { user, token },
      });

      toast.success('Login successful');
      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Login failed';

      dispatch({ type: AUTH_ACTIONS.FAILURE, payload: msg });
      toast.error(msg);

      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.START });

      const res = await axios.post(
        `${BASE_URL}/auth/register`,
        userData
      );

      const { token, user } = res.data;

      localStorage.setItem('token', token);

      dispatch({
        type: AUTH_ACTIONS.SUCCESS,
        payload: { user, token },
      });

      toast.success('Registration successful');
      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Registration failed';

      dispatch({ type: AUTH_ACTIONS.FAILURE, payload: msg });
      toast.error(msg);

      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out');
  }, []);

  const updateProfile = useCallback(async (userData) => {
    try {
      const res = await axios.put(
        `${BASE_URL}/users/${state.user.userId}`,
        userData
      );

      dispatch({
        type: AUTH_ACTIONS.SUCCESS,
        payload: { user: res.data },
      });

      toast.success('Profile updated');
      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        'Update failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  /* =========================
     Derived State (NO functions!)
  ========================= */

  const role = useMemo(() => {
    if (state.user?.role) return state.user.role;
    return extractRoleFromToken(state.token);
  }, [state.user, state.token]);

  const isAdmin = useMemo(() => role === 'admin', [role]);

  /* =========================
     Memoized Context Value
  ========================= */

  const value = useMemo(
    () => ({
      ...state,
      role,
      isAdmin,
      login,
      register,
      logout,
      updateProfile,
      clearError,
    }),
    [state, role, isAdmin, login, register, logout, updateProfile, clearError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* =========================
   Hook
========================= */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};