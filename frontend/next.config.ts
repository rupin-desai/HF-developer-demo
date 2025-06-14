import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://hf-developer-demo.onrender.com' 
      : 'http://localhost:8080'  // 🔧 FIXED: Changed from 5000 to 8080
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
