"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  sex: string;
  preferredLanguage: string;
  heardFrom: string;
  barriersToLearning: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  educationLevel: string;
  employmentStatus: string;
  schoolInterest: string;
  programInterests: string[];
  closestHub: any;
  createdAt: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated by validating token with server
  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      // Set initial state from localStorage while validating
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      // Validate token with server
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update with fresh data from server
        setUser(data.user);
        setToken(storedToken);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't clear localStorage on network errors, just set loading to false
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Set localStorage first
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Then update state
        setUser(data.user);
        setToken(data.token);
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log('AuthContext Debug:', {
      user: user?.email,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.isAdmin || false,
      loading,
      hasToken: !!token
    });
  }, [user, loading, token]);

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.isAdmin || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
