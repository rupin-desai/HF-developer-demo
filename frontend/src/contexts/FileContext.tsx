"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MedicalFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  contentType: string;
  fileUrl: string;
}

interface FileUploadData {
  fileName: string;
  fileType: string;
  file: File;
}

interface FileContextType {
  files: MedicalFile[];
  isLoading: boolean;
  uploadFile: (fileData: FileUploadData) => Promise<boolean>;
  deleteFile: (fileId: string) => Promise<boolean>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  viewFile: (fileId: string) => void;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

// Use environment variable if available, fallback to hardcoded URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://hf-developer-demo.onrender.com' 
    : 'http://localhost:5000');

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFiles(data.files);
        } else {
          console.error('Failed to fetch files:', data.message);
          setFiles([]);
        }
      } else {
        console.error('Failed to fetch files:', response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (fileData: FileUploadData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('fileName', fileData.fileName);
      formData.append('fileType', fileData.fileType);
      formData.append('file', fileData.file);

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshFiles();
        return true;
      } else {
        console.error('Upload failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshFiles();
        return true;
      } else {
        console.error('Delete failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const downloadFile = useCallback(async (fileId: string, fileName: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
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
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed:', response.statusText);
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }, []);

  const viewFile = useCallback((fileId: string): void => {
    const viewUrl = `${API_BASE_URL}/api/files/${fileId}/view`;
    window.open(viewUrl, '_blank');
  }, []);

  const value = {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    downloadFile,
    viewFile,
    refreshFiles
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};