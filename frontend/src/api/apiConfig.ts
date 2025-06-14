// API Configuration and Base Setup

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    CURRENT_USER: '/api/auth/me', // 🔧 Try this instead, or check your backend routes
  },
  // Profile endpoints
  PROFILE: {
    UPDATE: '/api/profile/update',
  },
  // File endpoints
  FILES: {
    UPLOAD: '/api/files/upload',
    LIST: '/api/files',
    DOWNLOAD: '/api/files',
    DELETE: '/api/files',
    VIEW: '/api/files',
  },
  // Static files
  STATIC: {
    FILES: '/staticfiles',
  },
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

  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Remove Content-Type for FormData
  if (config.body instanceof FormData) {
    const headers = config.headers as Record<string, string>;
    delete headers['Content-Type'];
  }

  console.log(`API Request: ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    
    // Log response for debugging
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    return response;
  } catch (error) {
    console.error(`API Request failed: ${url}`, error);
    throw error;
  }
};

// Helper function to get file URLs
export const getFileViewUrl = (fileId: string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.FILES.VIEW}/${fileId}/view`;
};

export const getFileDownloadUrl = (fileId: string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.FILES.DOWNLOAD}/${fileId}/download`;
};

export const getStaticFileUrl = (filePath: string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.STATIC.FILES}/${filePath}`;
};

export { API_BASE_URL };