import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser, type AuthResponse } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'profitcruiser-auth';

const storeAuth = (payload: AuthResponse) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
};

const loadAuth = (): AuthResponse | null => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch (error) {
    console.error('Failed to parse auth cache', error);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = loadAuth();
    if (!cached) {
      setIsLoading(false);
      return;
    }

    setToken(cached.token);
    setUser(cached.user);

    fetchCurrentUser(cached.token)
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persistSession = useCallback((auth: AuthResponse) => {
    setToken(auth.token);
    setUser(auth.user);
    storeAuth(auth);
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      setIsLoading(true);
      try {
        const auth = await loginUser(payload);
        persistSession(auth);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload: { email: string; username: string; password: string }) => {
      setIsLoading(true);
      try {
        const auth = await registerUser(payload);
        persistSession(auth);
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout
    }),
    [user, token, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

