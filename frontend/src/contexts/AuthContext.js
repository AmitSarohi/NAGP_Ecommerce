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

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AUTH_ACTIONS = {
  START: 'START',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  LOGOUT: 'LOGOUT',
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
      return { ...initialState, isLoading: false, error: action.payload };

    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };

    default:
      return state;
  }
};

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

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const getToken = useCallback(() => state.token, [state.token]);

  useEffect(() => {
    setupInterceptors(getToken, dispatch);
  }, [getToken]);

  useEffect(() => {
    const loadUser = async () => {
      if (!state.token) {
        dispatch({ type: AUTH_ACTIONS.SUCCESS, payload: { user: null } });
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/auth/verify`);
        dispatch({
          type: AUTH_ACTIONS.SUCCESS,
          payload: { user: res.data.user },
        });
      } catch {
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    loadUser();
  }, [state.token]);

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

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  const setAuthData = useCallback((user, token) => {
    localStorage.setItem('token', token);
    dispatch({ type: AUTH_ACTIONS.SUCCESS, payload: { user, token } });
  }, []);

  const role = useMemo(() => state.user?.role || 'user', [state.user]);
  const isAdmin = useMemo(() => role === 'admin', [role]);

  const value = useMemo(
    () => ({
      ...state,
      role,
      isAdmin,
      login,
      logout,
      setAuthData,
    }),
    [state, role, isAdmin, login, logout, setAuthData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);