"use client";

import { useState, useEffect } from 'react';
import SettingsTab from '@/components/admin/SettingsTab';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { token, isAdmin } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && isAdmin) {
      loadSettings();
    }
  }, [token, isAdmin]);

  const loadSettings = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Failed to load settings:', response.status);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: any) => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: newSettings })
      });
      
      if (response.ok) {
        setSettings(newSettings);
        return true;
      } else {
        console.error('Failed to update settings:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Settings</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <SettingsTab 
      settings={settings} 
      setSettings={setSettings}
      onSave={updateSettings}
    />
  );
} 