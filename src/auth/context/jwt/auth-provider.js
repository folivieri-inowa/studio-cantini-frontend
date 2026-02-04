'use client';

import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

// eslint-disable-next-line import/no-unresolved
import axios, { endpoints } from 'src/utils/axios';

import { AuthContext } from './auth-context';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

// NOTE:
// We only build demo at basic level.
// Customer will need to do some extra handling yourself if you want to extend the logic and other features...

// ----------------------------------------------------------------------

const initialState = {
  user: null,
  loading: true,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGIN') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'REGISTER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

const STORAGE_KEY = 'accessToken';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEY);
      console.log('🔍 Initialize - accessToken from localStorage:', accessToken ? 'FOUND' : 'NOT FOUND');

      if (accessToken && isValidToken(accessToken)) {
        console.log('✅ Token is valid, setting session...');
        setSession(accessToken);

        console.log('📡 Fetching user from /auth/me...');
        const response = await axios.get(endpoints.auth.me);
        console.log('📥 Response from /auth/me:', response.data);

        const { user } = response.data.data;
        console.log('👤 User extracted:', user);

        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...user,
              accessToken,
            },
          },
        });
        console.log('✅ User dispatched to context');
      } else {
        console.log('❌ No valid token found');
        dispatch({
          type: 'INITIAL',
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      console.error('❌ Initialize error:', error);
      dispatch({
        type: 'INITIAL',
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (email, password, db) => {
    const data = {
      email,
      password,
      db
    };

    console.log('🔐 Login attempt for:', email);
    const response = await axios.post(endpoints.auth.login, data);
    console.log('📥 Login response:', response.data);

    // Il backend wrappa in {data: {accessToken, user}}
    const { accessToken, user } = response.data.data;
    console.log('🔑 AccessToken:', accessToken ? 'RECEIVED' : 'MISSING');
    console.log('👤 User:', user);

    console.log('💾 Saving session to localStorage...');
    setSession(accessToken);

    dispatch({
      type: 'LOGIN',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });
    console.log('✅ User dispatched to context after login');
  }, []);

  // REGISTER
  const register = useCallback(async (email, password, firstName, lastName) => {
    const data = {
      email,
      password,
      firstName,
      lastName,
    };

    const response = await axios.post(endpoints.auth.register, data);

    const { accessToken, user } = response.data;

    sessionStorage.setItem(STORAGE_KEY, accessToken);

    dispatch({
      type: 'REGISTER',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    // Clear session
    setSession(null);

    // Dispatch logout action
    dispatch({
      type: 'LOGOUT',
    });

    // Clear local storage or session storage if used
    localStorage.clear();
    sessionStorage.clear();

    // Reload the page to clear any cached data
    window.location.reload();
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'jwt',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      logout,
    }),
    [login, logout, register, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
