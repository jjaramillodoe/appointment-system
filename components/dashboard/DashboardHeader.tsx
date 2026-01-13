'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, Bell, LogOut } from 'lucide-react';

interface User {
  firstName: string;
  isAdmin?: boolean;
}

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleAdminDashboard = () => {
    router.push('/admin/dashboard');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="bg-primary-600 rounded-lg p-2 mr-3">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Adult Education Dashboard
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            
            {user?.isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <span className="mr-2">Admin Dashboard</span>
                <GraduationCap className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 