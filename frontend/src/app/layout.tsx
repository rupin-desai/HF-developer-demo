import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FileProvider } from "@/contexts/FileContext";

export const metadata: Metadata = {
  title: "Medical Records Dashboard",
  description: "Secure medical records management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <AuthProvider>
          <FileProvider>{children}</FileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
