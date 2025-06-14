"use client";

import { apiRequest, API_ENDPOINTS } from './apiConfig';
import type { 
  User, 
  LoginRequest, 
  SignupRequest, 
  AuthResponse,
  ApiResponse 
} from './types';

// 🔧 Session storage keys
const SESSION_KEYS = {
  USER_DATA: 'medical_user_data',
  SESSION_TOKEN: 'medical_session_token',
  LAST_LOGIN: 'medical_last_login'
} as const;

// 🔧 Session storage utilities
const SessionStorage = {
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(user));
        localStorage.setItem(SESSION_KEYS.LAST_LOGIN, new Date().toISOString());
        console.log('User data stored in localStorage:', user);
      } catch (error) {
        console.error('Error storing user data:', error);
      }
    }
  },
  
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem(SESSION_KEYS.USER_DATA);
      const lastLogin = localStorage.getItem(SESSION_KEYS.LAST_LOGIN);
      
      if (!userData || !lastLogin) return null;
      
      // Check if session is older than 24 hours
      const loginTime = new Date(lastLogin);
      const now = new Date();
      const hoursElapsed = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursElapsed > 24) {
        console.log('Session expired, clearing storage');
        SessionStorage.clearSession();
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      console.log('Retrieved user from localStorage:', parsedUser);
      return parsedUser;
    } catch (error) {
      console.error('Error reading user from storage:', error);
      SessionStorage.clearSession(); // Clear corrupted data
      return null;
    }
  },
  
  clearSession: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_KEYS.USER_DATA);
        localStorage.removeItem(SESSION_KEYS.SESSION_TOKEN);
        localStorage.removeItem(SESSION_KEYS.LAST_LOGIN);
        console.log('Session cleared from localStorage');
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
  },
  
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSION_KEYS.SESSION_TOKEN, token);
        console.log('Session token stored');
      } catch (error) {
        console.error('Error storing session token:', error);
      }
    }
  },
  
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(SESSION_KEYS.SESSION_TOKEN);
    } catch (error) {
      console.error('Error reading session token:', error);
      return null;
    }
  }
};

// 🔧 Helper function to safely parse JSON responses
const safeJsonParse = async (response: Response): Promise<any> => {
  try {
    // Clone the response to avoid stream consumption issues
    const responseClone = response.clone();
    const text = await responseClone.text();
    
    console.log('Raw response text:', text);
    
    // Check if response is empty
    if (!text || text.trim() === '') {
      console.log('Empty response received');
      return { success: false, message: 'Empty response from server' };
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(text);
    console.log('Parsed JSON response:', parsed);
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error);
    
    // Try to get the response text for debugging
    try {
      const responseClone2 = response.clone();
      const text = await responseClone2.text();
      console.error('Response text that failed to parse:', text);
    } catch (textError) {
      console.error('Could not read response text:', textError);
    }
    
    return { success: false, message: 'Invalid response format from server' };
  }
};

// 🔧 Helper to dispatch user events
const dispatchUserEvents = (userData: User) => {
  if (typeof window !== 'undefined') {
    console.log('Dispatching user events for:', userData);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: userData 
      }));
      console.log('userLoggedIn event dispatched');
    }, 50);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('userStateChanged', { 
        detail: userData 
      }));
      console.log('userStateChanged event dispatched');
    }, 150);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: userData 
      }));
      console.log('userProfileUpdated event dispatched');
    }, 250);
  }
};

export class AuthService {
  /**
   * Check authentication status with localStorage fallback
   */
  static async checkAuthStatus(): Promise<User | null> {
    console.log('Checking authentication status...');
    
    try {
      // First try localStorage
      const cachedUser = SessionStorage.getUser();
      console.log('Cached user from localStorage:', cachedUser);
      
      // If we have cached user, return it immediately and verify in background
      if (cachedUser) {
        console.log('Using cached user data:', cachedUser);
        
        // Try to verify with server in background (don't wait for it)
        setTimeout(async () => {
          try {
            const response = await apiRequest(API_ENDPOINTS.AUTH.CURRENT_USER, {
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${SessionStorage.getToken() || ''}`,
              }
            });
            
            if (response.ok) {
              const data: ApiResponse<User> = await safeJsonParse(response);
              if (data.success && data.data) {
                console.log("Background auth verification successful");
                SessionStorage.setUser(data.data);
              }
            }
          } catch (error) {
            console.log('Background auth verification failed (not critical):', error);
          }
        }, 100);
        
        return cachedUser;
      }
      
      // No cached user, try server verification
      try {
        const response = await apiRequest(API_ENDPOINTS.AUTH.CURRENT_USER, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${SessionStorage.getToken() || ''}`,
          }
        });
        
        console.log(`Auth check response status: ${response.status}`);
        
        if (response.ok) {
          const data: ApiResponse<User> = await safeJsonParse(response);
          
          if (data.success && data.data) {
            console.log("Server auth check successful:", data.data);
            SessionStorage.setUser(data.data);
            return data.data;
          }
        }
      } catch (error) {
        console.log('Server auth check failed:', error);
      }
      
      console.log('No valid user found');
      return null;
    } catch (error) {
      console.error('Auth status check failed:', error);
      
      // Final fallback to cached user
      const cachedUser = SessionStorage.getUser();
      if (cachedUser) {
        console.log("Error occurred, using cached user:", cachedUser);
        return cachedUser;
      }
      
      return null;
    }
  }

  /**
   * Login user with enhanced session handling
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Attempting login for:', credentials.email);
    
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log(`Login response status: ${response.status}`);

      // Handle non-OK responses first
      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        console.error('Login failed with status:', response.status, errorData);
        return { 
          success: false, 
          user: undefined,
          message: errorData.message || `Login failed: ${response.status}` 
        };
      }

      // Parse successful response
      const data: any = await safeJsonParse(response);
      console.log('Login response data:', data);

      // 🔧 FIX: Check the actual response structure from your backend
      if (data.success && data.user) { // ✅ Your backend returns { success: true, user: {...} }
        console.log("Login successful, received user data:", data.user);
        
        // Store user data
        SessionStorage.setUser(data.user);
        
        // Store session token if provided
        if (data.sessionToken) {
          console.log('Session token found in response');
          SessionStorage.setToken(data.sessionToken);
        }
        
        // Extract additional session token from response headers
        const headerToken = response.headers.get('Authorization') || 
                           response.headers.get('X-Session-Token') ||
                           response.headers.get('Set-Cookie');
        
        if (headerToken) {
          console.log('Additional session token found in headers');
          SessionStorage.setToken(headerToken);
        }
        
        // Dispatch events
        dispatchUserEvents(data.user);
        
        return {
          success: true,
          user: data.user,
          message: data.message || 'Login successful'
        };
      } else {
        // API explicitly returned success: false
        console.error('Login failed - API returned success: false:', data.message);
        return { 
          success: false, 
          user: undefined,
          message: data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        user: undefined,
        message: 'Network error. Please check your connection.' 
      };
    }
  }

  /**
   * Logout with session cleanup
   */
  static async logout(): Promise<void> {
    console.log('Logging out user...');
    
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${SessionStorage.getToken() || ''}`,
        }
      });
      
      console.log(`Logout response status: ${response.status}`);
      
      // Don't try to parse logout response - it might be empty
      if (response.ok) {
        console.log('Logout successful on server');
      } else {
        console.warn('Logout request failed on server, but clearing local session');
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local session regardless of server response
      SessionStorage.clearSession();
      console.log('Local session cleared');
    }
  }

  /**
   * Signup user
   */
  static async signup(userData: Omit<User, 'id' | 'profileImage'> & { password: string }): Promise<boolean> {
    console.log('Attempting signup for:', userData.email);
    
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log(`Signup response status: ${response.status}`);

      if (response.ok) {
        try {
          const data = await safeJsonParse(response);
          console.log('Signup successful:', data.message);
          return true;
        } catch (parseError) {
          console.log('Signup successful (empty response)');
          return true;
        }
      } else {
        const errorData = await safeJsonParse(response);
        console.error('Signup failed:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userData: Partial<User>, profilePicture?: File): Promise<AuthResponse> {
    console.log('Updating user profile:', userData);
    
    try {
      const formData = new FormData();
      
      // Add user data
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add profile picture if provided
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
        console.log('Profile picture added to form data');
      }

      const response = await apiRequest(API_ENDPOINTS.PROFILE.UPDATE, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${SessionStorage.getToken() || ''}`,
        },
        body: formData,
      });

      console.log(`Profile update response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        console.error('Profile update failed:', errorData.message);
        return { 
          success: false, 
          user: undefined, // 🔧 FIX: Use undefined instead of null
          message: errorData.message || 'Profile update failed' 
        };
      }

      // Safely parse JSON response
      const data: ApiResponse<User> = await safeJsonParse(response);

      if (data.success && data.data) {
        console.log('Profile update successful:', data.data);
        
        // Update stored user data
        SessionStorage.setUser(data.data);
        
        // Dispatch profile updated event
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
              detail: data.data 
            }));
            console.log('userProfileUpdated event dispatched');
          }
        }, 100);
        
        return {
          success: true,
          user: data.data,
          message: data.message || 'Profile updated successfully'
        };
      } else {
        console.error('Profile update failed:', data.message);
        return { 
          success: false, 
          user: undefined, // 🔧 FIX: Use undefined instead of null
          message: data.message || 'Profile update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        user: undefined, // 🔧 FIX: Use undefined instead of null
        message: 'Network error during profile update' 
      };
    }
  }

  /**
   * Force refresh user data
   */
  static async refreshUserData(): Promise<User | null> {
    console.log('Force refreshing user data...');
    
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.CURRENT_USER, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${SessionStorage.getToken() || ''}`,
        }
      });

      if (response.ok) {
        const data: ApiResponse<User> = await safeJsonParse(response);
        if (data.success && data.data) {
          console.log('User data refreshed successfully:', data.data);
          SessionStorage.setUser(data.data);
          
          // Dispatch refresh event
          dispatchUserEvents(data.data);
          
          return data.data;
        }
      }
      
      console.log('Failed to refresh user data');
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
}