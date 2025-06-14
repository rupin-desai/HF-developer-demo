"use client";

import { apiRequest, API_ENDPOINTS } from './apiConfig';
import type { MedicalFile, FileUploadRequest } from './types';

export interface FileResponse {
  success: boolean;
  files: MedicalFile[];
  message?: string;
}

export interface UploadResponse {
  success: boolean;
  file?: MedicalFile;
  message?: string;
}

export class FileService {
  // Allowed file extensions
  static getAllowedExtensions(): string[] {
    return ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
  }

  // File validation
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedExtensions = FileService.getAllowedExtensions();
    const maxFileSize = 10; // MB
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
      };
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxFileSize}MB`
      };
    }
    
    return { valid: true };
  }

  // Get all files
  static async getFiles(): Promise<FileResponse> {
    try {
      const response = await apiRequest(API_ENDPOINTS.FILES.LIST, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          files: data.files || [],
          message: data.message
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          files: [],
          message: errorData.message || 'Failed to fetch files'
        };
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      return {
        success: false,
        files: [],
        message: 'Network error while fetching files'
      };
    }
  }

  // Upload a file
  static async uploadFile(fileData: FileUploadRequest): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('fileType', fileData.fileType);
      formData.append('fileName', fileData.fileName);

      const response = await apiRequest(API_ENDPOINTS.FILES.UPLOAD, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          file: data.file,
          message: data.message || 'File uploaded successfully'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Failed to upload file'
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        message: 'Network error while uploading file'
      };
    }
  }

  // 🔧 FIX: Delete a file
  static async deleteFile(fileId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Construct the delete endpoint URL
      const deleteEndpoint = `${API_ENDPOINTS.FILES.DELETE}/${fileId}`;
      
      const response = await apiRequest(deleteEndpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          message: data.message || 'File deleted successfully'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Failed to delete file'
        };
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        message: 'Network error while deleting file'
      };
    }
  }

  // 🔧 FIX: Download a file
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      // Construct the download endpoint URL
      const downloadEndpoint = `${API_ENDPOINTS.FILES.DOWNLOAD}/${fileId}/download`;
      
      const response = await apiRequest(downloadEndpoint, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // 🔧 FIX: View/open a file
  static viewFile(fileId: string): void {
    // Construct the view endpoint URL
    const viewEndpoint = `${API_ENDPOINTS.FILES.VIEW}/${fileId}/view`;
    
    // Open in new tab
    window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${viewEndpoint}`, '_blank');
  }
}