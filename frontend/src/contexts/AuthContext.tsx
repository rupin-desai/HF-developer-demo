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

interface SignupData {
  fullName: string;
  email: string;
  gender: string;
  phoneNumber: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Add this property
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // Clear invalid data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
      } finally {
        setIsLoading(false); // Set loading to false when done
      }
    };

    checkAuth();
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
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(dummyUser));
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      console.log('Signup attempt:', userData);
      
      // Simulate API response
      const newUser: User = {
        id: Date.now().toString(),
        fullName: userData.fullName,
        email: userData.email,
        gender: userData.gender as 'male' | 'female',
        phoneNumber: userData.phoneNumber,
        profileImage: "/images/default-avatar.png"
      };

      setUser(newUser);
      setIsAuthenticated(true);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading, // Include isLoading in the context value
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};