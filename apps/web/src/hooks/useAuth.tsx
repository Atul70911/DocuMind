import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api, setTokens, clearTokens, getAccessToken, ApiError } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
        '/auth/login',
        { email, password },
        { skipAuth: true }
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
        '/auth/register',
        { email, password, name },
        { skipAuth: true }
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    clearTokens();
    setUser(null);
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
  }, []);

  return (
  <AuthContext.Provider value={{ user, isAuthenticated: !!getAccessToken(), login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}