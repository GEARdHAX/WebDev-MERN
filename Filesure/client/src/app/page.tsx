'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { userInfo } = useAuthStore();

  useEffect(() => {
    // Check if the auth state has been loaded
    if (userInfo) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to login
      router.push('/login');
    }
  }, [userInfo, router]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      Loading...
    </div>
  );
}