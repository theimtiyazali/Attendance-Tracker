import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout } from '@/lib/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (username: string, role: User['role']) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (username: string, role: User['role']) => {
    const loggedInUser = authLogin(username, role);
    if (loggedInUser) {
      setUser(loggedInUser);
      toast.success(`Welcome, ${loggedInUser.name}! You are logged in as ${loggedInUser.role}.`);
    } else {
      toast.error("Login failed. Please check your credentials.");
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
    toast.info("You have been logged out.");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};