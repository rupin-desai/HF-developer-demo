"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, User, Upload, FileText, Eye, Download, Trash2, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";

type FileType = "LabReport" | "Prescription" | "XRay" | "BloodReport" | "MRIScan" | "CTScan";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, updateProfile, isAuthenticated, isLoading } = useAuth();
  const { files, uploadFile, deleteFile, downloadFile, viewFile, refreshFiles, isLoading: filesLoading } = useFiles();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState(user || {
    id: "",
    fullName: "",
    email: "",
    gender: "male" as const,
    phoneNumber: "",
    profileImage: ""
  });
  const [uploadFormData, setUploadFormData] = useState({
    fileType: "LabReport" as FileType,
    fileName: "",
    file: null as File | null
  });
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileFormData(user);
    }
  }, [user]);

  // Load files when component mounts - but only once per session
  useEffect(() => {
    if (isAuthenticated && !hasLoadedFiles && !filesLoading) {
      refreshFiles();
      setHasLoadedFiles(true);
    }
  }, [isAuthenticated, hasLoadedFiles, filesLoading, refreshFiles]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if user not available
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Profile handlers
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfileSave = () => {
    updateProfile(profileFormData);
    setIsEditingProfile(false);
    console.log("Profile updated:", profileFormData);
  };

  const handleProfileCancel = () => {
    setProfileFormData(user || {
      id: "",
      fullName: "",
      email: "",
      gender: "male" as const,
      phoneNumber: "",
      profileImage: ""
    });
    setIsEditingProfile(false);
  };

  // File upload handlers
  const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUploadFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFormData.file && uploadFormData.fileName) {
      const success = await uploadFile({
        fileName: uploadFormData.fileName,
        fileType: uploadFormData.fileType,
        file: uploadFormData.file
      });
      
      if (success) {
        setUploadFormData({
          fileType: "LabReport",
          fileName: "",
          file: null
        });
        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        console.log("File uploaded successfully");
      } else {
        console.log("File upload failed");
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
    const success = await deleteFile(fileId);
    if (success) {
      console.log("File deleted successfully");
    } else {
      console.log("File deletion failed");
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    await downloadFile(fileId, fileName);
  };

  const handleFileView = (fileId: string) => {
    viewFile(fileId);
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Medical Records Dashboard
                </h1>
                <p className="text-sm text-gray-600">Secure Health Management</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-4">
                  <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <User className="w-12 h-12 text-gray-600" />
                    </div>
                  </div>
                  
                  {isEditingProfile && (
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900">{profileFormData.fullName}</h3>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileFormData.fullName}
                    onChange={handleProfileInputChange}
                    disabled={!isEditingProfile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileFormData.email}
                    onChange={handleProfileInputChange}
                    disabled={!isEditingProfile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profileFormData.gender}
                    onChange={handleProfileInputChange}
                    disabled={!isEditingProfile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileFormData.phoneNumber}
                    onChange={handleProfileInputChange}
                    disabled={!isEditingProfile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditingProfile && (
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleProfileSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleProfileCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - File Upload */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Medical File</h2>
              
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    name="fileType"
                    value={uploadFormData.fileType}
                    onChange={handleUploadInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    name="fileName"
                    value={uploadFormData.fileName}
                    onChange={handleUploadInputChange}
                    placeholder="e.g., Blood Test Results - January 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Upload
                  </label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Choose file
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG up to 10MB
                      </p>
                      {uploadFormData.file && (
                        <p className="text-sm text-green-600 mt-2">
                          Selected: {uploadFormData.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={filesLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {filesLoading ? "Uploading..." : "Upload File"}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Bottom Section - File List */}
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Uploaded Files</h2>
            
            {filesLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No files uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1 truncate" title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">Type: {file.fileType}</p>
                    <p className="text-sm text-gray-600 mb-1">Size: {formatFileSize(file.fileSize)}</p>
                    <p className="text-sm text-gray-600 mb-3">Date: {formatDate(file.uploadDate)}</p>
                    
                    <div className="flex flex-col space-y-2">
                      {/* First row - View and Download */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleFileView(file.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-2 rounded transition-colors duration-200 flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleFileDownload(file.id, file.fileName)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-2 rounded transition-colors duration-200 flex items-center justify-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                      {/* Second row - Delete */}
                      <button 
                        onClick={() => handleFileDelete(file.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-2 rounded transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}