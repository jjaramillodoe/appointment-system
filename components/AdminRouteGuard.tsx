"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (!isAdmin) {
        // Not admin, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // User is authenticated and is admin
      setIsAuthorized(true);
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  // Add debug logging
  useEffect(() => {
    console.log('AdminRouteGuard Debug:', {
      loading,
      isAuthenticated,
      isAdmin,
      isAuthorized
    });
  }, [loading, isAuthenticated, isAdmin, isAuthorized]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
}
