"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";

// Import Dashboard components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardProfileCard from "@/components/dashboard/DashboardProfileCard";
import DashboardFileUpload from "@/components/dashboard/DashboardFileUpload";
import DashboardFilesList from "@/components/dashboard/DashboardFilesList";
import DashboardLoadingSpinner from "@/components/dashboard/DashboardLoadingSpinner";

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
    return <DashboardLoadingSpinner />;
  }

  // Show loading if user not available
  if (!user) {
    return <DashboardLoadingSpinner />;
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
  const handleProfilePictureChange = (file: File) => {
    setSelectedProfilePicture(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader 
        userName={user.fullName} 
        onLogout={() => logout()} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <DashboardProfileCard
              user={user}
              profileFormData={profileFormData}
              isEditingProfile={isEditingProfile}
              isUpdatingProfile={isUpdatingProfile}
              profilePicturePreview={profilePicturePreview}
              onEditClick={() => setIsEditingProfile(true)}
              onProfileInputChange={handleProfileInputChange}
              onProfilePictureChange={handleProfilePictureChange}
              onProfileSave={handleProfileSave}
              onProfileCancel={handleProfileCancel}
            />

            <DashboardFileUpload
              uploadFormData={uploadFormData}
              isLoading={filesLoading}
              onInputChange={handleUploadInputChange}
              onFileChange={handleFileChange}
              onSubmit={handleFileUpload}
            />
          </div>

          <DashboardFilesList
            files={files}
            isLoading={filesLoading}
            onViewFile={viewFile}
            onDownloadFile={downloadFile}
            onDeleteFile={deleteFile}
          />
        </div>
      </main>
    </div>
  );
}