'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, Bell, LogOut } from 'lucide-react';
import LanguageSelector from '../LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  firstName: string;
  isAdmin?: boolean;
}

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleAdminDashboard = () => {
    router.push('/admin/dashboard');
  };

  return (
    <header className="bg-gradient-to-r from-primary-700 to-primary-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 mr-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Adult Education Dashboard
              </h1>
              <p className="text-primary-100">Welcome back, {user.firstName}!</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="hidden md:flex items-center space-x-2 text-primary-100 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="text-sm font-medium">Notifications</span>
            </button>

            <LanguageSelector />

            {user?.isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="bg-yellow-500 hover:bg-yellow-600 text-primary-900 px-4 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center"
              >
                <span className="mr-2">Admin Dashboard</span>
                <GraduationCap className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center backdrop-blur-sm border border-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 