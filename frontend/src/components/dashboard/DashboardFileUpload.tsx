"use client";

import { Upload } from "lucide-react";

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
}

export default function DashboardFileUpload({
  uploadFormData,
  isLoading,
  onInputChange,
  onFileChange,
  onSubmit
}: DashboardFileUploadProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload File</h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
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
            onChange={onFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !uploadFormData.file || !uploadFormData.fileName}
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