import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api.get('/auth/me');
      setUser(me);
      return me;
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        return null;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      await api.post('/auth/login', { email, password });
      return refreshAuth();
    },
    [refreshAuth]
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setUser(null);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      user,
      isAuth: Boolean(user),
      loading,
      refreshAuth,
      login,
      logout,
    }),
    [user, loading, refreshAuth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
