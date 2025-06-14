"use client";

import DashboardProfilePicture from "./DashboardProfilePicture";
import DashboardProfileForm from "./DashboardProfileForm";

type Gender = "male" | "female";

interface ProfileFormData {
  id: string;
  fullName: string;
  email: string;
  gender: Gender;
  phoneNumber: string;
  profileImage: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  gender: "male" | "female";
  phoneNumber: string;
  profileImage: string;
}

interface DashboardProfileCardProps {
  user: User;
  profileFormData: ProfileFormData;
  isEditingProfile: boolean;
  isUpdatingProfile: boolean;
  profilePicturePreview: string;
  onEditClick: () => void;
  onProfileInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onProfilePictureChange: (file: File) => void;
  onProfileSave: () => void;
  onProfileCancel: () => void;
}

export default function DashboardProfileCard({
  user,
  profileFormData,
  isEditingProfile,
  isUpdatingProfile,
  profilePicturePreview,
  onEditClick,
  onProfileInputChange,
  onProfilePictureChange,
  onProfileSave,
  onProfileCancel
}: DashboardProfileCardProps) {
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
        {!isEditingProfile && (
          <button
            onClick={onEditClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>

      <DashboardProfilePicture
        profileImageUrl={getProfileImageUrl()}
        userName={user.fullName}
        userEmail={user.email}
        isEditing={isEditingProfile}
        onProfilePictureChange={onProfilePictureChange}
      />

      <DashboardProfileForm
        user={user}
        isEditing={isEditingProfile}
        profileFormData={profileFormData}
        isUpdating={isUpdatingProfile}
        onInputChange={onProfileInputChange}
        onSave={onProfileSave}
        onCancel={onProfileCancel}
      />
    </div>
  );
}