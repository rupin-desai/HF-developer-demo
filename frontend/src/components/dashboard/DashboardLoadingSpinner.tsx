"use client";

interface DashboardLoadingSpinnerProps {
  message?: string;
}

export default function DashboardLoadingSpinner({ message = "Loading..." }: DashboardLoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}