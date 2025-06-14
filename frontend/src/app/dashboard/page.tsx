"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, User, Upload, FileText, Eye, Download, Trash2, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";

type FileType = "LabReport" | "Prescription" | "XRay" | "BloodReport" | "MRIScan" | "CTScan";

type Gender = "male" | "female";

interface ProfileFormData {
  id: string;
  fullName: string;
  email: string;
  gender: Gender;
  phoneNumber: string;
  profileImage: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, updateProfile, isAuthenticated, isLoading } = useAuth();
  const { files, uploadFile, deleteFile, downloadFile, viewFile, refreshFiles, isLoading: filesLoading } = useFiles();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    id: "",
    fullName: "",
    email: "",
    gender: "male",
    phoneNumber: "",
    profileImage: ""
  });
  
  const [uploadFormData, setUploadFormData] = useState({
    fileType: "LabReport" as FileType,
    fileName: "",
    file: null as File | null
  });

  // Profile picture state
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to update profile form data
  const updateProfileFormData = useCallback((userData: any) => {
    if (userData) {
      console.log("Updating profile form with:", userData);
      setProfileFormData({
        id: userData.id || "",
        fullName: userData.fullName || "",
        email: userData.email || "",
        gender: (userData.gender as Gender) || "male",
        phoneNumber: userData.phoneNumber || "",
        profileImage: userData.profileImage || ""
      });
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      console.log("User data changed, updating profile form:", user);
      updateProfileFormData(user);
    }
  }, [user, updateProfileFormData]);

  // Listen for ALL login events
  useEffect(() => {
    const handleUserLoggedIn = (event: any) => {
      console.log("UserLoggedIn event received:", event.detail);
      const userData = event.detail;
      if (userData) {
        updateProfileFormData(userData);
      }
    };

    const handleUserStateChanged = (event: any) => {
      console.log("UserStateChanged event received:", event.detail);
      const userData = event.detail;
      if (userData) {
        updateProfileFormData(userData);
      }
    };

    const handleProfileUpdated = (event: any) => {
      console.log("UserProfileUpdated event received:", event.detail);
      const userData = event.detail;
      if (userData) {
        updateProfileFormData(userData);
        setIsEditingProfile(false);
        setSelectedProfilePicture(null);
        setProfilePicturePreview("");
      }
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    window.addEventListener('userStateChanged', handleUserStateChanged);
    window.addEventListener('userProfileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userStateChanged', handleUserStateChanged);
      window.removeEventListener('userProfileUpdated', handleProfileUpdated);
    };
  }, [updateProfileFormData]);

  // Load files when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User authenticated, loading files...");
      refreshFiles();
    }
  }, [isAuthenticated, user, refreshFiles]);

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
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: name === 'gender' ? value as Gender : value
    }));
  };

  // Profile picture handlers
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileSave = async () => {
    setIsUpdatingProfile(true);
    try {
      const success = await updateProfile(profileFormData, selectedProfilePicture || undefined);
      if (success) {
        console.log("Profile updated successfully");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("An error occurred while updating your profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    if (user) {
      setProfileFormData({
        id: user.id || "",
        fullName: user.fullName || "",
        email: user.email || "",
        gender: (user.gender as Gender) || "male",
        phoneNumber: user.phoneNumber || "",
        profileImage: user.profileImage || ""
      });
    }
    setIsEditingProfile(false);
    setSelectedProfilePicture(null);
    setProfilePicturePreview("");
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
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  };

  const getProfileImageUrl = () => {
    if (profilePicturePreview) {
      return profilePicturePreview;
    }
    if (user.profileImage) {
      return `http://localhost:8080/staticfiles/${user.profileImage}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔄 REVERTED: Original Header Design */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Medical Records Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.fullName}</span>
              <button
                onClick={() => logout()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🔄 REVERTED: Original Main Content Layout */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 🔄 REVERTED: Original Profile Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Picture Section */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    {getProfileImageUrl() ? (
                      <img 
                        src={getProfileImageUrl()!} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-600" />
                    )}
                  </div>
                  {isEditingProfile && (
                    <button
                      onClick={handleProfilePictureClick}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-200"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.fullName}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      name="fullName"
                      value={profileFormData.fullName}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      name="email"
                      value={profileFormData.email}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  {isEditingProfile ? (
                    <select
                      name="gender"
                      value={profileFormData.gender}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-gray-900 capitalize">{user.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileFormData.phoneNumber}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{user.phoneNumber}</p>
                  )}
                </div>

                {isEditingProfile && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleProfileSave}
                      disabled={isUpdatingProfile}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleProfileCancel}
                      disabled={isUpdatingProfile}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 🔄 REVERTED: Original File Upload Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload File</h2>
              
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Type</label>
                  <select
                    name="fileType"
                    value={uploadFormData.fileType}
                    onChange={handleUploadInputChange}
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
                    onChange={handleUploadInputChange}
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
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={filesLoading || !uploadFormData.file || !uploadFormData.fileName}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  {filesLoading ? (
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
          </div>

          {/* 🔄 REVERTED: Original Files List Section */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Files</h2>
            
            {filesLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file) => (
                      <tr key={file.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {file.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.fileType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewFile(file.id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => downloadFile(file.id, file.fileName)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </button>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
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
        </div>
      </main>
    </div>
  );
}