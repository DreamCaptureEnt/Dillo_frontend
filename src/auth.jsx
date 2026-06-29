import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/auth/me/')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(identifier, password) {
      const data = await apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async register(payload) {
      const data = await apiFetch('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async requestPasswordReset(identifier) {
      return apiFetch('/auth/password-reset/', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      });
    },
    async confirmPasswordReset(payload) {
      return apiFetch('/auth/password-reset-confirm/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    logout() {
      setToken(null);
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
