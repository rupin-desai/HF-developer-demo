import { apiRequest, API_ENDPOINTS } from './apiConfig';
import type { 
  User, 
  LoginRequest, 
  SignupRequest, 
  UpdateProfileRequest,
  AuthResponse,
  ApiResponse 
} from './types';

// 🔧 ENSURE: Export class properly
export class AuthService {
  /**
   * Check current authentication status
   */
  static async checkAuthStatus(): Promise<User | null> {
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.ME);
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    }
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Login successful, received user data:", userData);
        
        // Dispatch login events for other components
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
        
        return { success: true, user: userData };
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        return { success: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  }

  /**
   * Register new user
   */
  static async signup(userData: SignupRequest): Promise<boolean> {
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        console.log("Signup successful");
        return true;
      } else {
        const errorData = await response.json();
        console.error('Signup failed:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST'
      });
      console.log("Logout successful");
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }

  /**
   * Update user profile with optional profile picture
   */
  static async updateProfile(
    userData: Partial<User>, 
    profilePicture?: File
  ): Promise<{ success: boolean; user?: User; message?: string }> {
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
      } else if (userData.profileImage) {
        formData.append('existingProfileImage', userData.profileImage);
      }

      const response = await apiRequest(API_ENDPOINTS.PROFILE.UPDATE, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        
        if (result.success && result.user) {
          console.log("Profile updated successfully:", result.user);
          
          // Dispatch update events
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
              detail: result.user 
            }));
          }, 50);
          
          return { 
            success: true, 
            user: result.user 
          };
        } else {
          return { 
            success: false, 
            message: result.message || 'Profile update failed' 
          };
        }
      } else {
        const errorData: ApiResponse = await response.json();
        return { 
          success: false, 
          message: errorData.message || 'Profile update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: 'An error occurred while updating profile' 
      };
    }
  }

  /**
   * Get profile image URL
   */
  static getProfileImageUrl(profileImagePath?: string): string | null {
    if (!profileImagePath) return null;
    return `${API_ENDPOINTS.STATIC.PROFILE_IMAGE(profileImagePath)}`;
  }
}