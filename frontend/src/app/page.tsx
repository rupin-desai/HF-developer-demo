"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page (since user should authenticate first)
    router.push("/pages/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-medium text-gray-600">
        Redirecting to login...
      </div>
    </div>
  );
}