/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../config/api';

const SESSION_STORAGE_KEY = 'hanachimo_session_v1';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredSession();
  }, []);

  const verifySession = useCallback(async (sessionToken) => {
    const response = await fetch(apiUrl('/api/auth/me'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Session expired or invalid.');
    }

    const payload = await response.json();
    return payload.user;
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      const session = readStoredSession();
      if (!session?.token) {
        setLoading(false);
        return;
      }

      try {
        const validUser = await verifySession(session.token);
        setToken(session.token);
        setUser(validUser);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, [logout, verifySession]);

  const login = useCallback(async (userid, password) => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userid, password }),
    });

    const raw = await response.text();
    let payload = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      if (response.status === 500 && !payload?.message) {
        throw new Error('Auth API is not reachable. Start backend server and verify backend .env config.');
      }
      throw new Error(payload?.message || `Login failed (${response.status}).`);
    }

    const nextSession = {
      token: payload.token,
      user: payload.user,
    };

    writeStoredSession(nextSession);
    setToken(nextSession.token);
    setUser(nextSession.user);

    return nextSession.user;
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
