"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  fullName: string;
  email: string;
  gender: 'male' | 'female';
  phoneNumber: string;
  profileImage: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      console.log('Login attempt:', { email, password });
      
      // Simulate API response
      const dummyUser: User = {
        id: "1",
        fullName: "Dr. Sarah Johnson",
        email: email,
        gender: "female",
        phoneNumber: "+1 (555) 123-4567",
        profileImage: "/images/default-avatar.png"
      };

      setUser(dummyUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(dummyUser));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (userData: any): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      console.log('Signup attempt:', userData);
      
      // Simulate API response
      const newUser: User = {
        id: Date.now().toString(),
        fullName: userData.fullName,
        email: userData.email,
        gender: userData.gender,
        phoneNumber: userData.phoneNumber,
        profileImage: "/images/default-avatar.png"
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};