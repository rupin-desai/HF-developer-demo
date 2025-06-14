"use client";

import { Save } from "lucide-react";

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

interface DashboardProfileFormProps {
  user: User;
  isEditing: boolean;
  profileFormData: ProfileFormData;
  isUpdating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function DashboardProfileForm({
  user,
  isEditing,
  profileFormData,
  isUpdating,
  onInputChange,
  onSave,
  onCancel
}: DashboardProfileFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        {isEditing ? (
          <input
            type="text"
            name="fullName"
            value={profileFormData.fullName}
            onChange={onInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        ) : (
          <p className="mt-1 text-gray-900">{user.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        {isEditing ? (
          <input
            type="email"
            name="email"
            value={profileFormData.email}
            onChange={onInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        ) : (
          <p className="mt-1 text-gray-900">{user.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gender</label>
        {isEditing ? (
          <select
            name="gender"
            value={profileFormData.gender}
            onChange={onInputChange}
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
        {isEditing ? (
          <input
            type="tel"
            name="phoneNumber"
            value={profileFormData.phoneNumber}
            onChange={onInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        ) : (
          <p className="mt-1 text-gray-900">{user.phoneNumber}</p>
        )}
      </div>

      {isEditing && (
        <div className="flex space-x-3 pt-4">
          <button
            onClick={onSave}
            disabled={isUpdating}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {isUpdating ? (
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
            onClick={onCancel}
            disabled={isUpdating}
            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}