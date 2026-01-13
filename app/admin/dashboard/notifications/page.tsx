"use client";

import { useState, useEffect } from 'react';
import NotificationsTab from '@/components/admin/NotificationsTab';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  const { token, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    lowCapacityAlert: true,
    noShowTracking: true,
    reminderSystem: true
  });

  useEffect(() => {
    if (token && isAdmin) {
      loadNotifications();
    }
  }, [token, isAdmin]);

  const loadNotifications = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });

      const response = await fetch(`/api/admin/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to load notifications:', response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationsTab 
      notifications={notifications} 
      settings={notificationSettings} 
      setSettings={setNotificationSettings} 
      onRefresh={loadNotifications} 
    />
  );
} 