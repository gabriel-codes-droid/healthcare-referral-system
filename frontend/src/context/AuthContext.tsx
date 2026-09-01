import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../Types';
import { login as firebaseLogin, signup as firebaseSignup, logout as firebaseLogout, onAuthStateChange, refreshCurrentUser } from '../firebase/auth';

 type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string, organization?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await firebaseLogin(email, password);
    setUser(loggedInUser);
  };

  const signup = async (name: string, email: string, password: string, role?: string, organization?: string) => {
    const { user: registeredUser } = await firebaseSignup(name, email, password, role, organization);
    setUser(registeredUser);
  };

  const refreshUser = async () => {
    setUser(await refreshCurrentUser());
  };

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
