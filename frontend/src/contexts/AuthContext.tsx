"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// 🔧 FIXED: Use explicit import path and named import
import { AuthService } from '@/api/authService';
// 🔧 ALTERNATIVE: Or use the index file
// import { AuthService } from '@/api';
import type { User } from '@/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'profileImage'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>, profilePicture?: File) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AuthService.checkAuthStatus();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await AuthService.login({ email, password });
      
      if (result.success && result.user) {
        setUser(result.user);
        
        // Force React state update
        setTimeout(() => {
          console.log("Force user context update");
          setUser(() => ({ ...result.user! }));
        }, 250);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'profileImage'> & { password: string }): Promise<boolean> => {
    try {
      return await AuthService.signup(userData);
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (userData: Partial<User>, profilePicture?: File): Promise<boolean> => {
    try {
      const result = await AuthService.updateProfile(userData, profilePicture);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        console.error('Profile update failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};