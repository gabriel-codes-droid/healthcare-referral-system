import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../Types';
import { api } from '../services/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string, organization?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sympra_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('sympra_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user: loggedInUser } = await api.login(email, password);
    localStorage.setItem('sympra_token', token);
    setUser(loggedInUser);
  };

  const signup = async (name: string, email: string, password: string, role?: string, organization?: string) => {
    const { token, user: registeredUser } = await api.signup(name, email, password, role, organization);
    localStorage.setItem('sympra_token', token);
    setUser(registeredUser);
  };

  const logout = () => {
    localStorage.removeItem('sympra_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
