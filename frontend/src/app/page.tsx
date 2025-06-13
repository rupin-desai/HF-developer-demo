"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "@/app/pages/auth/SignUpPage";
import DashboardPage from "@/app/pages/dashboard/DashboardPage";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Auth routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}