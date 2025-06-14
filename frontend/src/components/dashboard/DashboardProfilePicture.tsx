"use client";

import { useRef } from "react";
import { Camera, User } from "lucide-react";

interface DashboardProfilePictureProps {
  profileImageUrl: string | null;
  userName: string;
  userEmail: string;
  isEditing: boolean;
  onProfilePictureChange: (file: File) => void;
}

export default function DashboardProfilePicture({
  profileImageUrl,
  userName,
  userEmail,
  isEditing,
  onProfilePictureChange
}: DashboardProfilePictureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      onProfilePictureChange(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="relative">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-gray-600" />
          )}
        </div>
        {isEditing && (
          <button
            onClick={handleClick}
            className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-200"
          >
            <Camera className="w-3 h-3" />
          </button>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{userName}</h3>
        <p className="text-gray-600">{userEmail}</p>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}