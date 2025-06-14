// Main API exports

// 🔧 CRITICAL: Export services as named exports
export { AuthService } from './authService';
export { FileService } from './fileService';
export { API_BASE_URL, API_ENDPOINTS, apiRequest } from './apiConfig';

// 🔧 CRITICAL: Export all types
export * from './types';

