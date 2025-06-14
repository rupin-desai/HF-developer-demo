"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  fullName: string;
  email: string;
  gender: "male" | "female";
  phoneNumber: string;
  profileImage: string;
}

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

// Use environment variable if available, fallback to hardcoded URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://hf-developer-demo.onrender.com'
  : 'http://localhost:8080';

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
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Login successful, setting user data:", userData);
        
        // 🔧 CRITICAL FIX: Set user state first
        setUser(userData);
        
        // 🔧 CRITICAL FIX: Use multiple event dispatches with user data
        setTimeout(() => {
          console.log("Dispatching userLoggedIn event with data:", userData);
          window.dispatchEvent(new CustomEvent('userLoggedIn', { 
            detail: userData 
          }));
        }, 50);
        
        setTimeout(() => {
          console.log("Dispatching userStateChanged event");
          window.dispatchEvent(new CustomEvent('userStateChanged', { 
            detail: userData 
          }));
        }, 150);
        
        // 🔧 NEW: Force React state update
        setTimeout(() => {
          console.log("Force user context update");
          setUser((prevUser) => ({ ...userData }));
        }, 250);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'profileImage'> & { password: string }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
    }
  };

  // 🔧 NEW: Connect to backend profile update API
  const updateProfile = async (userData: Partial<User>, profilePicture?: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      
      // Add user data to form
      if (userData.fullName) formData.append('fullName', userData.fullName);
      if (userData.email) formData.append('email', userData.email);
      if (userData.gender) formData.append('gender', userData.gender);
      if (userData.phoneNumber) formData.append('phoneNumber', userData.phoneNumber);
      
      // Add profile picture if provided
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      } else if (user?.profileImage) {
        formData.append('existingProfileImage', user.profileImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          console.log("Profile updated successfully:", result.user);
          setUser(result.user);
          
          // Dispatch update events
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
              detail: result.user 
            }));
          }, 50);
          
          return true;
        } else {
          console.error('Profile update failed:', result.message);
          return false;
        }
      } else {
        const errorData = await response.json();
        console.error('Profile update failed:', errorData.message);
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