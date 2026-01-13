"use client";

import { useState } from 'react';
import { Settings, Save, RefreshCw, Database, Bell, Clock, Users, Shield } from 'lucide-react';

interface SettingsTabProps {
  settings: any;
  setSettings: (settings: any) => void;
  onSave?: (settings: any) => Promise<boolean | undefined>;
}

export default function SettingsTab({ settings, setSettings, onSave }: SettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const handleSave = async () => {
    setSaving(true);
    
    try {
      if (onSave) {
        const success = await onSave(settings);
        if (success) {
          alert('Settings saved successfully!');
        } else {
          alert('Failed to save settings. Please try again.');
        }
      } else {
        // Fallback to localStorage if no API save function
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Backup completed successfully!\nBackup ID: ${data.backup.id}\nSize: ${data.backup.size}`);
      } else {
        alert('Failed to create backup. Please try again.');
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('Failed to create backup. Please try again.');
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Cache cleared successfully!\nCleared: ${data.cache.clearedCaches.join(', ')}`);
      } else {
        alert('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      alert('Failed to clear cache. Please try again.');
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaultSettings = {
        general: {
          systemName: 'Adult Education Appointment System',
          timeZone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY'
        },
        appointments: {
          defaultCapacity: 20,
          reminderHours: 24,
          autoConfirm: false,
          maxAppointmentsPerUser: 1
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          lowCapacityAlerts: true
        },
        users: {
          allowRegistration: true,
          requireEmailVerification: true,
          sessionTimeout: 30
        },
        security: {
          passwordMinLength: 8,
          requireStrongPasswords: true,
          twoFactorAuth: false
        },
        system: {
          database: 'MongoDB',
          framework: 'Next.js 15',
          environment: 'development',
          lastBackup: new Date().toISOString()
        }
      };
      setSettings(defaultSettings);
      localStorage.setItem('adminSettings', JSON.stringify(defaultSettings));
    }
  };

  const sections = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'appointments', name: 'Appointments', icon: Clock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">Configure your appointment system preferences</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">General Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                    <input
                      type="text"
                      value={settings.general?.systemName || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, systemName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                    <select 
                      value={settings.general?.timeZone || 'America/New_York'}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, timeZone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select 
                      value={settings.general?.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, dateFormat: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appointments' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Appointment Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Slot Capacity</label>
                    <input
                      type="number"
                      value={settings.appointments?.defaultCapacity || 20}
                      onChange={(e) => setSettings({
                        ...settings,
                        appointments: { ...settings.appointments, defaultCapacity: parseInt(e.target.value) }
                      })}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Number of appointments allowed per time slot by default</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Hours</label>
                    <input
                      type="number"
                      value={settings.appointments?.reminderHours || 24}
                      onChange={(e) => setSettings({
                        ...settings,
                        appointments: { ...settings.appointments, reminderHours: parseInt(e.target.value) }
                      })}
                      min="1"
                      max="168"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Hours before appointment to send reminder</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto-confirm Appointments</label>
                      <p className="text-sm text-gray-500">Automatically confirm appointments when scheduled</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appointments?.autoConfirm || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          appointments: { ...settings.appointments, autoConfirm: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Appointments per User</label>
                    <input
                      type="number"
                      value={settings.appointments?.maxAppointmentsPerUser || 1}
                      onChange={(e) => setSettings({
                        ...settings,
                        appointments: { ...settings.appointments, maxAppointmentsPerUser: parseInt(e.target.value) }
                      })}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Maximum number of appointments a user can have at once</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Notification Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-sm text-gray-500">Send notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications?.emailNotifications || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                      <p className="text-sm text-gray-500">Send notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications?.smsNotifications || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, smsNotifications: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Low Capacity Alerts</label>
                      <p className="text-sm text-gray-500">Alert when slots are nearly full</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications?.lowCapacityAlerts || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, lowCapacityAlerts: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">User Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow User Registration</label>
                      <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.users?.allowRegistration || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          users: { ...settings.users, allowRegistration: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
                      <p className="text-sm text-gray-500">Require users to verify their email address</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.users?.requireEmailVerification || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          users: { ...settings.users, requireEmailVerification: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.users?.sessionTimeout || 30}
                      onChange={(e) => setSettings({
                        ...settings,
                        users: { ...settings.users, sessionTimeout: parseInt(e.target.value) }
                      })}
                      min="5"
                      max="480"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">How long before users are automatically logged out</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Security Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
                    <input
                      type="number"
                      value={settings.security?.passwordMinLength || 8}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                      })}
                      min="6"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Require Strong Passwords</label>
                      <p className="text-sm text-gray-500">Require uppercase, lowercase, numbers, and symbols</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security?.requireStrongPasswords || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, requireStrongPasswords: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security?.twoFactorAuth || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorAuth: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">System Information</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Database</h5>
                      <p className="text-sm text-gray-600">{settings.system?.database || 'MongoDB'}</p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Framework</h5>
                      <p className="text-sm text-gray-600">{settings.system?.framework || 'Next.js 15'}</p>
                      <p className="text-sm text-gray-500">Latest version</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Environment</h5>
                      <p className="text-sm text-gray-600">{settings.system?.environment || 'Development'}</p>
                      <p className="text-sm text-gray-500">Local server</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Last Backup</h5>
                      <p className="text-sm text-gray-600">
                        {settings.system?.lastBackup ? 
                          new Date(settings.system.lastBackup).toLocaleString() : 
                          'Never'
                        }
                      </p>
                      <p className="text-sm text-gray-500">Automatic</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => alert('Update check functionality coming soon!')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Check for Updates
                    </button>
                    <button 
                      onClick={handleBackup}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Backup Now
                    </button>
                    <button 
                      onClick={handleClearCache}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 