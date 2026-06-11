'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'user';

type AuthUser = { username: string; role: UserRole };

type AuthCtx = {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => string | null;
  signOut: () => void;
};

const ACCOUNTS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'admin1', role: 'admin' },
  user: { password: '123456', role: 'user' },
};

const AuthContext = createContext<AuthCtx>({
  user: null, role: 'user', loading: true, isAdmin: false,
  signIn: () => null, signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nihongo_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const signIn = (username: string, password: string): string | null => {
    const account = ACCOUNTS[username];
    if (!account || account.password !== password) return 'Sai tài khoản hoặc mật khẩu';
    const u: AuthUser = { username, role: account.role };
    setUser(u);
    localStorage.setItem('nihongo_user', JSON.stringify(u));
    return null;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('nihongo_user');
  };

  const role = user?.role ?? 'user';

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin: role === 'admin', signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
