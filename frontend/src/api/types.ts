// API Types and Interfaces

export interface User {
  id: string;
  fullName: string;
  email: string;
  gender: "male" | "female";
  phoneNumber: string;
  profileImage: string;
}

export interface MedicalFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  contentType: string;
  fileUrl: string;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends Omit<User, 'id' | 'profileImage'> {
  password: string;
}

export interface UpdateProfileRequest extends Partial<User> {
  profilePicture?: File;
  existingProfileImage?: string;
}

export interface FileUploadRequest {
  fileName: string;
  fileType: string;
  file: File;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse extends ApiResponse {
  user?: User;
}

export interface FilesResponse extends ApiResponse {
  files?: MedicalFile[];
}

export interface FileUploadResponse extends ApiResponse {
  file?: MedicalFile;
}