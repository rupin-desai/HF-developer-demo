"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/api/authService';
import type { User } from '@/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'profileImage'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>, profilePicture?: File) => Promise<boolean>;
  refreshUser: () => Promise<void>;
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
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = user !== null;

  // Check authentication status on app load
  useEffect(() => {
    if (!isInitialized) {
      checkAuthStatus();
    }
  }, [isInitialized]);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medical_user_data') {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
          } catch (error) {
            console.error('Error parsing user data from storage:', error);
          }
        } else {
          // User data was cleared in another tab
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network restored, refreshing user data...");
      if (user) {
        refreshUser();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log("Checking auth status...");
      
      const userData = await AuthService.checkAuthStatus();
      console.log("Auth check result:", userData);
      
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.checkAuthStatus();
      console.log("User refresh result:", userData);
      setUser(userData);
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.login({ email, password });
      
      if (result.success && result.user) {
        console.log("Login successful, setting user:", result.user);
        setUser(result.user);
        
        // Force immediate user data refresh after a short delay
        setTimeout(async () => {
          console.log("Force refreshing user data after login");
          await refreshUser();
        }, 200);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      await AuthService.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};