"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// 🔧 FIXED: Use proper import path
import { FileService } from '@/api/fileService';
import type { MedicalFile, FileUploadRequest } from '@/api/types';

interface FileContextType {
  files: MedicalFile[];
  isLoading: boolean;
  uploadFile: (fileData: FileUploadRequest) => Promise<boolean>;
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

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh files list
  const refreshFiles = useCallback(async () => {
    console.log("Refreshing files...");
    setIsLoading(true);
    
    try {
      const result = await FileService.getFiles();
      setFiles(result.files);
    } catch (error) {
      console.error('Error refreshing files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for user login events
  useEffect(() => {
    const handleUserLogin = () => {
      console.log("User logged in event received, refreshing files...");
      refreshFiles();
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, [refreshFiles]);

  const uploadFile = useCallback(async (fileData: FileUploadRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 🔧 REMOVED: Double validation - validation should happen in component
      // The component should validate before calling this function
      
      const result = await FileService.uploadFile(fileData);
      
      if (result.success) {
        await refreshFiles();
        return true;
      } else {
        console.error('Upload failed:', result.message);
        alert(result.message || 'Upload failed');
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await FileService.deleteFile(fileId);
      
      if (result.success) {
        await refreshFiles();
        return true;
      } else {
        console.error('Delete failed:', result.message);
        alert(result.message || 'Delete failed');
        return false;
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred during deletion');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const downloadFile = useCallback(async (fileId: string, fileName: string): Promise<void> => {
    try {
      await FileService.downloadFile(fileId, fileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
      throw error;
    }
  }, []);

  const viewFile = useCallback((fileId: string): void => {
    FileService.viewFile(fileId);
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