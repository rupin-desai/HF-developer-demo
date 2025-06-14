// API Configuration and Base Setup

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://hf-developer-demo.onrender.com'
    : 'http://localhost:8080'
  );

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  },
  // Profile endpoints
  PROFILE: {
    UPDATE: '/api/profile/update'
  },
  // File endpoints
  FILES: {
    LIST: '/api/files',
    UPLOAD: '/api/files/upload',
    DELETE: (id: string) => `/api/files/${id}`,
    DOWNLOAD: (id: string) => `/api/files/${id}/download`,
    // 🔧 FIXED: Correct view endpoint
    VIEW: (id: string) => `/api/files/${id}/view`,
    // 🔧 NEW: Direct file access endpoint
    STREAM: (id: string) => `/api/files/${id}/stream`
  },
  // Static files
  STATIC: {
    PROFILE_IMAGE: (path: string) => `/staticfiles/${path}`,
    // 🔧 NEW: Direct file access
    FILE: (path: string) => `/staticfiles/${path}`
  }
} as const;

// Default fetch options
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Helper function for API calls
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_FETCH_OPTIONS.headers,
      ...(options.headers || {})
    }
  };

  // Remove Content-Type for FormData requests
  if (options.body instanceof FormData) {
    const headers = { ...config.headers } as Record<string, string>;
    delete headers['Content-Type'];
    config.headers = headers;
  }

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// 🔧 NEW: Helper to get full file URL
export const getFileViewUrl = (fileId: string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.FILES.VIEW(fileId)}`;
};

// 🔧 NEW: Helper to get file stream URL  
export const getFileStreamUrl = (fileId: string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.FILES.STREAM(fileId)}`;
};