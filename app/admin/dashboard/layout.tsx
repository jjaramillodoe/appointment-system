"use client";

import { logger } from '@/lib/logger';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Calendar, CalendarDays, Activity,
  Bell, FileText, Settings, LogOut, MapPin, Zap, Clock, Mail, History, Database, School, BookOpen, ClipboardCheck,
  Inbox, Menu, X, type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { HubFilterProvider } from '@/contexts/HubFilterContext';
import HubFilterBar from '@/components/admin/HubFilterBar';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, assignedHub, loading, token } = useAuth();
  const [hubName, setHubName] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

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
            const assignedId = assignedHub.toString();
            const hub = Array.isArray(hubs)
              ? hubs.find((h: any) => {
                  const hubId = h._id?.toString() || h._id;
                  return hubId === assignedId;
                }) || (hubs.length === 1 ? hubs[0] : null)
              : null;
            if (hub) {
              setHubName(hub.name);
            } else {
              logger.warn('Hub not found for ID:', assignedHub);
            }
          }
        } catch (error) {
          logger.error('Error fetching hub name:', error);
        }
      } else {
        setHubName(null);
      }
    };

    fetchHubName();
  }, [assignedHub, token, isSuperAdmin]);



  const isCurrent = (href: string) =>
    href === '/admin/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Grouped by task; super-admin-only pages stay hidden for other admins as before
  const navGroups: { label: string; items: { name: string; href: string; icon: LucideIcon }[] }[] = [
    {
      label: 'Front desk',
      items: [
        { name: 'Today', href: '/admin/dashboard/today', icon: ClipboardCheck },
        { name: 'Appointments', href: '/admin/dashboard/appointments', icon: Calendar },
        { name: 'Users', href: '/admin/dashboard/users', icon: Users },
      ],
    },
    {
      label: 'Scheduling',
      items: [
        { name: 'Schedule', href: '/admin/dashboard/schedule', icon: CalendarDays },
        { name: 'Capacity', href: '/admin/dashboard/capacity', icon: Activity },
        ...(isSuperAdmin ? [
          { name: 'Blackout', href: '/admin/dashboard/blackout-dates', icon: Clock },
          { name: 'Generator', href: '/admin/dashboard/schedule-generator', icon: Zap },
        ] : []),
      ],
    },
    {
      label: 'Sites & programs',
      items: [
        { name: 'Hubs', href: '/admin/dashboard/hubs', icon: MapPin },
        { name: 'Schools', href: '/admin/dashboard/schools', icon: School },
        { name: 'Classes', href: '/admin/dashboard/classes', icon: BookOpen },
      ],
    },
    {
      label: 'Communication',
      items: [
        { name: 'Messages', href: '/admin/dashboard/communications', icon: Mail },
        ...(isSuperAdmin ? [{ name: 'Reminders', href: '/admin/dashboard/reminders', icon: Bell }] : []),
        { name: 'Notifications', href: '/admin/dashboard/notifications', icon: Inbox },
      ],
    },
    {
      label: 'Insights',
      items: [
        { name: 'Analytics', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Reports', href: '/admin/dashboard/reports', icon: FileText },
      ],
    },
    ...(isSuperAdmin ? [{
      label: 'System',
      items: [
        { name: 'Audit Logs', href: '/admin/dashboard/audit-logs', icon: History },
        { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
        { name: 'Maintenance', href: '/admin/dashboard/maintenance', icon: Database },
      ],
    }] : []),
  ];

  return (
    <AdminRouteGuard>
      <HubFilterProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Top Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
                  onClick={() => setNavOpen((open) => !open)}
                  aria-controls="admin-sidebar"
                  aria-expanded={navOpen}
                  aria-label={navOpen ? 'Close menu' : 'Open menu'}
                >
                  {navOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                </button>
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
            {navOpen && (
              <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setNavOpen(false)} aria-hidden />
            )}
            <aside
              id="admin-sidebar"
              className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-200 overflow-y-auto transition-transform md:static md:translate-x-0 ${
                navOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <nav className="p-4" aria-label="Admin">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-4">
                    <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const current = isCurrent(item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setNavOpen(false)}
                              aria-current={current ? 'page' : undefined}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                current
                                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
                              <span>{item.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
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