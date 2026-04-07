import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BASE_URL = '/api';

/* =========================
   INITIAL STATE
========================= */
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/* =========================
   ACTIONS
========================= */
const AUTH_ACTIONS = {
  START: 'START',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  LOGOUT: 'LOGOUT',
};

/* =========================
   REDUCER
========================= */
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
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        token: null,
        isLoading: false,
      };

    default:
      return state;
  }
};

/* =========================
   AXIOS INTERCEPTORS
========================= */
let interceptorsInitialized = false;

const setupInterceptors = (getToken, dispatch) => {
  if (interceptorsInitialized) return;
  interceptorsInitialized = true;

  axios.interceptors.request.use((config) => {
    const token = getToken();

    const isAuthRoute =
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/google');

    if (token && !isAuthRoute) {
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
      }
      return Promise.reject(error);
    }
  );
};

/* =========================
   PROVIDER
========================= */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const getToken = useCallback(() => state.token, [state.token]);

  useEffect(() => {
    setupInterceptors(getToken, dispatch);
  }, [getToken]);

  /* =========================
     🔥 RESTORE USER FROM JWT
  ========================= */
  useEffect(() => {
    const token = state.token;

    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SUCCESS, payload: { user: null } });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
      };

      dispatch({
        type: AUTH_ACTIONS.SUCCESS,
        payload: { user, token },
      });

    } catch (err) {
      console.error('Invalid token', err);
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [state.token]);

  /* =========================
     LOGIN
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

      return { success: true };

    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Login failed';

      dispatch({ type: AUTH_ACTIONS.FAILURE, payload: msg });

      return { success: false };
    }
  }, []);

  /* =========================
     ✅ REGISTER (FIX ADDED)
  ========================= */
  const register = useCallback(async (data) => {
    try {
      dispatch({ type: AUTH_ACTIONS.START });

      const res = await axios.post(`${BASE_URL}/auth/register`, data);

      const { token, user } = res.data;

      // OPTIONAL: auto login after register
      localStorage.setItem('token', token);

      dispatch({
        type: AUTH_ACTIONS.SUCCESS,
        payload: { user, token },
      });

      return { success: true };

    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Registration failed';

      dispatch({ type: AUTH_ACTIONS.FAILURE, payload: msg });

      return { success: false };
    }
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  /* =========================
     SET AUTH DATA (OAUTH)
  ========================= */
  const setAuthData = useCallback((user, token) => {
    localStorage.setItem('token', token);

    dispatch({
      type: AUTH_ACTIONS.SUCCESS,
      payload: { user, token },
    });
  }, []);

  /* =========================
     DERIVED STATE
  ========================= */
  const role = useMemo(() => state.user?.role || 'user', [state.user]);
  const isAdmin = useMemo(() => role === 'admin', [role]);

  /* =========================
     CONTEXT VALUE
  ========================= */
  const value = useMemo(
    () => ({
      ...state,
      role,
      isAdmin,
      login,
      register, // ✅ FIX ADDED
      logout,
      setAuthData,
    }),
    [state, role, isAdmin, login, register, logout, setAuthData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);