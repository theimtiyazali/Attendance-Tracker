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
    console.log("AuthContext: useEffect - checking for stored user.");
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      console.log("AuthContext: Stored user found:", storedUser);
    } else {
      console.log("AuthContext: No stored user found.");
    }
  }, []);

  const login = (username: string, role: User['role']) => {
    console.log("AuthContext: Calling authLogin with", username, role);
    const loggedInUser = authLogin(username, role);
    if (loggedInUser) {
      console.log("AuthContext: authLogin successful, setting user state:", loggedInUser);
      setUser(loggedInUser);
      toast.success(`Welcome, ${loggedInUser.name}! You are logged in as ${loggedInUser.role}.`);
    } else {
      console.log("AuthContext: authLogin failed, showing error toast.");
      toast.error("Login failed. Please check your credentials.");
    }
    return loggedInUser;
  };

  const logout = () => {
    console.log("AuthContext: Logging out user.");
    authLogout();
    setUser(null);
    toast.info("You have been logged out.");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  console.log("AuthContext: Current isAuthenticated:", isAuthenticated, "User:", user);

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