"use client";

import { Eye, Download, Trash2, FileText, Image, File, Calendar, HardDrive, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";
import { getFileViewUrl, getFileStreamUrl, API_BASE_URL } from "@/api/apiConfig";

interface FileItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadDate?: string;
  contentType?: string;
  fileUrl?: string;
}

interface DashboardFilesListProps {
  files: FileItem[];
  isLoading: boolean;
  onViewFile: (fileId: string) => void;
  onDownloadFile: (fileId: string, fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export default function DashboardFilesList({
  files,
  isLoading,
  onViewFile,
  onDownloadFile,
  onDeleteFile
}: DashboardFilesListProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewError, setPreviewError] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Helper function to get file icon based on type
  const getFileIcon = (fileName: string, contentType?: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const type = contentType?.toLowerCase() || '';

    if (type.includes('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-8 h-8 text-green-500" />;
    }
    if (type.includes('pdf') || extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (type.includes('word') || ['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // Helper function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if file can be previewed
  const canPreview = (fileName: string, contentType?: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const type = contentType?.toLowerCase() || '';
    
    return type.includes('image/') || 
           ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '') ||
           type.includes('pdf') || 
           extension === 'pdf';
  };

  // 🔧 ENHANCED: Get the correct file URL for preview
  const getPreviewUrl = (file: FileItem): string => {
    // Try multiple URL patterns
    if (file.fileUrl && file.fileUrl.startsWith('http')) {
      return file.fileUrl;
    }
    
    // Use API endpoint for file viewing
    return getFileViewUrl(file.id);
  };

  // Handle file preview
  const handlePreview = (file: FileItem) => {
    if (canPreview(file.fileName, file.contentType)) {
      setSelectedFile(file);
      setIsPreviewOpen(true);
      setPreviewError("");
      setIsImageLoading(true);
    } else {
      onViewFile(file.id);
    }
  };

  // Close preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedFile(null);
    setPreviewError("");
    setIsImageLoading(false);
  };

  // Handle preview errors
  const handlePreviewError = (error: string) => {
    setPreviewError(error);
    setIsImageLoading(false);
  };

  return (
    <>
      <div className="mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
        {/* Header with view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Your Files ({files.length})
          </h2>
          
          {/* View mode toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No files uploaded yet</p>
            <p className="text-gray-400 text-sm mt-2">Upload your first medical record to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
              >
                {/* File icon/preview */}
                <div className="flex items-center justify-center h-20 mb-3">
                  {getFileIcon(file.fileName, file.contentType)}
                </div>
                
                {/* File details */}
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 text-sm truncate mb-1" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">{file.fileType}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</p>
                </div>
                
                {/* Actions */}
                <div className="flex justify-center space-x-2 mt-3">
                  <button
                    onClick={() => handlePreview(file)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadFile(file.id, file.fileName)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            {/* Mobile cards for small screens */}
            <div className="block sm:hidden space-y-4">
              {files.map((file) => (
                <div key={file.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.fileName, file.contentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {file.fileName}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <span>{file.fileType}</span>
                        <span>{formatFileSize(file.fileSize)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(file.uploadDate)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePreview(file)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDownloadFile(file.id, file.fileName)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getFileIcon(file.fileName, file.contentType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {file.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {file.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        {formatFileSize(file.fileSize)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(file.uploadDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(file)}
                          className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="hidden lg:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => onDownloadFile(file.id, file.fileName)}
                          className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          <span className="hidden lg:inline">Download</span>
                        </button>
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-900 flex items-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          <span className="hidden lg:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔧 ENHANCED: Preview Modal with Better Error Handling */}
      {isPreviewOpen && selectedFile && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closePreview}
            ></div>
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-5xl max-h-[95vh] w-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile.fileName, selectedFile.contentType)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {selectedFile.fileName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedFile.fileType} • {formatFileSize(selectedFile.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewFile(selectedFile.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Open in New Tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDownloadFile(selectedFile.id, selectedFile.fileName)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-4 max-h-[80vh] overflow-auto bg-gray-50">
                {previewError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                    <p className="text-red-600 mb-2">Failed to load preview</p>
                    <p className="text-gray-500 text-sm mb-4">{previewError}</p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => {
                          setPreviewError("");
                          setIsImageLoading(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => onViewFile(selectedFile.id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                ) : selectedFile.contentType?.includes('image/') ? (
                  <div className="text-center">
                    {isImageLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600">Loading image...</span>
                      </div>
                    )}
                    <img
                      src={getPreviewUrl(selectedFile)}
                      alt={selectedFile.fileName}
                      className={`max-w-full h-auto rounded-lg shadow-sm mx-auto ${isImageLoading ? 'hidden' : 'block'}`}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => {
                        handlePreviewError(`Unable to load image: ${selectedFile.fileName}`);
                      }}
                    />
                  </div>
                ) : selectedFile.fileName.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={getPreviewUrl(selectedFile)}
                      className="w-full h-full"
                      title={selectedFile.fileName}
                      onError={() => {
                        handlePreviewError(`Unable to load PDF: ${selectedFile.fileName}`);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Preview not available for this file type</p>
                    <p className="text-gray-400 text-sm mb-4">
                      File type: {selectedFile.contentType || 'Unknown'}
                    </p>
                    <button
                      onClick={() => onViewFile(selectedFile.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Open in New Tab
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}