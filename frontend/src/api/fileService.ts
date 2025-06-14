import { apiRequest, API_ENDPOINTS, API_BASE_URL } from './apiConfig';
import type { 
  MedicalFile, 
  FileUploadRequest,
  FilesResponse,
  FileUploadResponse,
  ApiResponse 
} from './types';

export class FileService {
  /**
   * Get all files for the current user
   */
  static async getFiles(): Promise<{ success: boolean; files: MedicalFile[] }> {
    try {
      console.log("Fetching files from API...");
      
      const response = await apiRequest(API_ENDPOINTS.FILES.LIST);

      if (response.ok) {
        const data: FilesResponse = await response.json();
        
        if (data.success && data.files) {
          console.log("Files loaded successfully:", data.files.length);
          return { 
            success: true, 
            files: data.files 
          };
        } else {
          console.error('Failed to fetch files:', data.message);
          return { success: false, files: [] };
        }
      } else {
        console.error('Failed to fetch files:', response.statusText);
        return { success: false, files: [] };
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      return { success: false, files: [] };
    }
  }

  /**
   * Upload a new file
   */
  static async uploadFile(fileData: FileUploadRequest): Promise<{ success: boolean; file?: MedicalFile; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('fileName', fileData.fileName);
      formData.append('fileType', fileData.fileType);
      formData.append('file', fileData.file);

      const response = await apiRequest(API_ENDPOINTS.FILES.UPLOAD, {
        method: 'POST',
        body: formData
      });

      const data: FileUploadResponse = await response.json();

      if (response.ok && data.success) {
        console.log("File uploaded successfully:", data.file);
        return { 
          success: true, 
          file: data.file 
        };
      } else {
        console.error('Upload failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Upload failed' 
        };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        message: 'An error occurred during upload' 
      };
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiRequest(API_ENDPOINTS.FILES.DELETE(fileId), {
        method: 'DELETE'
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        console.log("File deleted successfully");
        return { success: true };
      } else {
        console.error('Delete failed:', data.message);
        return { 
          success: false, 
          message: data.message || 'Delete failed' 
        };
      }
    } catch (error) {
      console.error('Delete error:', error);
      return { 
        success: false, 
        message: 'An error occurred during deletion' 
      };
    }
  }

  /**
   * Download a file
   */
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const response = await apiRequest(API_ENDPOINTS.FILES.DOWNLOAD(fileId));

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log("File downloaded successfully:", fileName);
      } else {
        console.error('Download failed:', response.statusText);
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * View a file in a new tab
   */
  static viewFile(fileId: string): void {
    const viewUrl = `${API_BASE_URL}${API_ENDPOINTS.FILES.VIEW(fileId)}`;
    window.open(viewUrl, '_blank');
    console.log("Opening file for viewing:", fileId);
  }

  /**
   * Get file URL for direct access
   */
  static getFileUrl(fileId: string): string {
    return `${API_BASE_URL}${API_ENDPOINTS.FILES.VIEW(fileId)}`;
  }

  /**
   * 🔧 FIXED: Validate file to match backend exactly
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'File size must be less than 10MB' 
      };
    }

    // 🔧 CRITICAL: Match backend validation exactly
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    const contentType = file.type.toLowerCase();
    
    // Backend allowed extensions (must match exactly)
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
    
    // Backend allowed MIME types (must match exactly)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',   // Progressive JPEG
      'image/png',
      'image/x-png',   // Alternative PNG
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'text/rtf',
      'application/octet-stream' // Fallback
    ];

    // Check file extension first
    if (!allowedExtensions.includes(fileExtension)) {
      return { 
        valid: false, 
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` 
      };
    }

    // Check MIME type
    if (contentType && !allowedMimeTypes.includes(contentType)) {
      console.warn(`MIME type "${contentType}" not in allowed list, but extension is valid. Allowing upload.`);
      // Don't block upload if extension is valid but MIME type is unusual
    }

    return { valid: true };
  }

  /**
   * Get allowed file extensions
   */
  static getAllowedExtensions(): string[] {
    return ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
  }

  /**
   * Get allowed MIME types
   */
  static getAllowedMimeTypes(): string[] {
    return [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',
      'image/png',
      'image/x-png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'text/rtf',
      'application/octet-stream'
    ];
  }
}