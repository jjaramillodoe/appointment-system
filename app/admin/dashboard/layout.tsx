"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Calendar, CalendarDays, Activity, 
  Bell, FileText, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { HubFilterProvider } from '@/contexts/HubFilterContext';
import HubFilterBar from '@/components/admin/HubFilterBar';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, assignedHub, loading, token } = useAuth();
  const [hubName, setHubName] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };

  // Fetch hub name when assignedHub is available
  useEffect(() => {
    const fetchHubName = async () => {
      if (assignedHub && token && !isSuperAdmin) {
        try {
          const response = await fetch('/api/admin/hubs', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const hubs = await response.json();
            // Match hub by _id (MongoDB ObjectId as string)
            const hub = hubs.find((h: any) => {
              // Handle both string and ObjectId formats
              const hubId = h._id?.toString() || h._id;
              const assignedId = assignedHub.toString();
              return hubId === assignedId;
            });
            if (hub) {
              setHubName(hub.name);
            } else {
              console.warn('Hub not found for ID:', assignedHub);
            }
          }
        } catch (error) {
          console.error('Error fetching hub name:', error);
        }
      } else {
        setHubName(null);
      }
    };

    fetchHubName();
  }, [assignedHub, token, isSuperAdmin]);



  const navigation = [
    { name: 'Analytics', href: '/admin/dashboard', icon: BarChart3, current: pathname === '/admin/dashboard' },
    { name: 'Users', href: '/admin/dashboard/users', icon: Users, current: pathname === '/admin/dashboard/users' },
    { name: 'Appointments', href: '/admin/dashboard/appointments', icon: Calendar, current: pathname === '/admin/dashboard/appointments' },
    { name: 'Schedule', href: '/admin/dashboard/schedule', icon: CalendarDays, current: pathname === '/admin/dashboard/schedule' },
    { name: 'Capacity', href: '/admin/dashboard/capacity', icon: Activity, current: pathname === '/admin/dashboard/capacity' },
    { name: 'Notifications', href: '/admin/dashboard/notifications', icon: Bell, current: pathname === '/admin/dashboard/notifications' },
    { name: 'Reports', href: '/admin/dashboard/reports', icon: FileText, current: pathname === '/admin/dashboard/reports' },
    // Only show Settings for super admins
    ...(isSuperAdmin ? [{ name: 'Settings', href: '/admin/dashboard/settings', icon: Settings, current: pathname === '/admin/dashboard/settings' }] : []),
  ];

  return (
    <AdminRouteGuard>
      <HubFilterProvider>
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">
                {isSuperAdmin ? (
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">Super Admin</span>
                    <span>Manage all hubs and system-wide settings</span>
                  </span>
                ) : assignedHub ? (
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">Hub Admin</span>
                    <span>Managing: {hubName || 'Loading hub...'}</span>
                  </span>
                ) : (
                  'Manage your appointment system'
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <HubFilterBar />
              <button 
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                    item.current
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

                     {/* Main Content */}
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {children}
               </div>
               
               {/* Footer */}
               <footer className="bg-white border-t border-gray-200 mt-auto">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                   <div className="flex flex-col md:flex-row justify-between items-center">
                     <div className="text-sm text-gray-600 mb-4 md:mb-0">
                       © {new Date().getFullYear()} Adult Education District 79. All rights reserved.
                     </div>
                     <div className="text-sm text-gray-500">
                       Developed by{' '}
                       <span className="font-medium text-gray-700">Javier Jaramillo</span>
                     </div>
                   </div>
                 </div>
               </footer>
             </div>
           </HubFilterProvider>
         </AdminRouteGuard>
       );
     } 