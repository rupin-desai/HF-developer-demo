"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

type FileType = "LabReport" | "Prescription" | "XRay" | "BloodReport" | "MRIScan" | "CTScan";

interface UploadFormData {
  fileType: FileType;
  fileName: string;
  file: File | null;
}

interface DashboardFileUploadProps {
  uploadFormData: UploadFormData;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  // 🔧 NEW: Pass validation logic from parent
  allowedExtensions?: string[];
  maxFileSize?: number;
  onFileValidation?: (file: File) => { valid: boolean; error?: string };
}

export default function DashboardFileUpload({
  uploadFormData,
  isLoading,
  onInputChange,
  onFileChange,
  onSubmit,
  allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'],
  maxFileSize = 10,
  onFileValidation
}: DashboardFileUploadProps) {
  // 🔧 SIMPLIFIED: State for validation errors only
  const [fileError, setFileError] = useState<string>("");

  // 🔧 SIMPLIFIED: Generate accept attribute from props
  const acceptAttribute = allowedExtensions.map(ext => {
    switch(ext) {
      case '.pdf': return 'application/pdf';
      case '.jpg':
      case '.jpeg': return 'image/jpeg';
      case '.png': return 'image/png';
      case '.gif': return 'image/gif';
      case '.doc': return 'application/msword';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return '';
    }
  }).filter(Boolean).join(',');

  // 🔧 SIMPLIFIED: File change handler with parent validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file && onFileValidation) {
      // Use parent's validation function
      const validation = onFileValidation(file);
      
      if (!validation.valid) {
        setFileError(validation.error || "Invalid file");
        // Clear the file input
        e.target.value = '';
        return;
      } else {
        setFileError(""); // Clear any previous errors
      }
    } else {
      setFileError(""); // Clear errors when no file selected
    }
    
    // Call the original handler
    onFileChange(e);
  };

  // 🔧 SIMPLIFIED: Submit handler with parent validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submit if validation function provided
    if (uploadFormData.file && onFileValidation) {
      const validation = onFileValidation(uploadFormData.file);
      if (!validation.valid) {
        setFileError(validation.error || "Invalid file");
        return;
      }
    }
    
    setFileError(""); // Clear any errors
    onSubmit(e);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload File</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">File Type</label>
          <select
            name="fileType"
            value={uploadFormData.fileType}
            onChange={onInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="LabReport">Lab Report</option>
            <option value="Prescription">Prescription</option>
            <option value="XRay">X-Ray</option>
            <option value="BloodReport">Blood Report</option>
            <option value="MRIScan">MRI Scan</option>
            <option value="CTScan">CT Scan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">File Name</label>
          <input
            type="text"
            name="fileName"
            value={uploadFormData.fileName}
            onChange={onInputChange}
            placeholder="Enter file name"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Select File</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept={acceptAttribute}
            className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
              fileError ? 'border-red-500' : ''
            }`}
            required
          />
          
          {/* Show file validation error */}
          {fileError && (
            <p className="mt-1 text-xs text-red-600">
              {fileError}
            </p>
          )}
          
          {/* Show allowed file types */}
          <p className="mt-1 text-xs text-gray-500">
            Allowed types: {allowedExtensions.join(', ')} (Max {maxFileSize}MB)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !uploadFormData.file || !uploadFormData.fileName || !!fileError}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </>
          )}
        </button>
      </form>
    </div>
  );
}