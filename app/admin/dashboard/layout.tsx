"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Calendar, CalendarDays, Activity,
  Bell, FileText, Settings, LogOut, MapPin, Zap, Clock, Mail, History
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
    { name: 'Hubs', href: '/admin/dashboard/hubs', icon: MapPin, current: pathname === '/admin/dashboard/hubs' },
    { name: 'Schedule', href: '/admin/dashboard/schedule', icon: CalendarDays, current: pathname === '/admin/dashboard/schedule' },
    { name: 'Capacity', href: '/admin/dashboard/capacity', icon: Activity, current: pathname === '/admin/dashboard/capacity' },
    { name: 'Generator', href: '/admin/dashboard/schedule-generator', icon: Zap, current: pathname === '/admin/dashboard/schedule-generator' },
    // Only show Reminders, Blackout Dates & Communications for super admins
    ...(isSuperAdmin ? [
      { name: 'Reminders', href: '/admin/dashboard/reminders', icon: Bell, current: pathname === '/admin/dashboard/reminders' },
      { name: 'Blackout', href: '/admin/dashboard/blackout-dates', icon: Clock, current: pathname === '/admin/dashboard/blackout-dates' },
      { name: 'Communications', href: '/admin/dashboard/communications', icon: Mail, current: pathname === '/admin/dashboard/communications' },
    ] : []),
    { name: 'Notifications', href: '/admin/dashboard/notifications', icon: Clock, current: pathname === '/admin/dashboard/notifications' },
    { name: 'Reports', href: '/admin/dashboard/reports', icon: FileText, current: pathname === '/admin/dashboard/reports' },
    // Only show Audit Logs & Settings for super admins
    ...(isSuperAdmin ? [
      { name: 'Audit Logs', href: '/admin/dashboard/audit-logs', icon: History, current: pathname === '/admin/dashboard/audit-logs' },
      { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings, current: pathname === '/admin/dashboard/settings' },
    ] : []),
  ];

  return (
    <AdminRouteGuard>
      <HubFilterProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Top Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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

          {/* Sidebar + Content Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
              <nav className="space-y-1 p-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="border-t border-gray-200 p-4 mt-8">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-1">Status</p>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Super Admin
                    </span>
                  ) : assignedHub ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Hub Admin
                      </span>
                      <p className="text-xs text-gray-600 mt-2">{hubName || 'Loading hub...'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Regular Admin</p>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-8">
                {children}
              </div>
            </main>
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