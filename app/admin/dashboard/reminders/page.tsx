"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCircle, AlertCircle, Loader, Save, RefreshCw } from 'lucide-react';

interface ReminderConfig {
  enabled: boolean;
  hoursBeforeAppointment: number;
  channel: 'email' | 'sms' | 'both';
  message?: string;
}

interface ReminderSettings {
  _id: string;
  isEnabled: boolean;
  reminders: ReminderConfig[];
}

export default function RemindersPage() {
  const { token, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remindersSent, setRemindersSent] = useState(0);

  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadSettings();
  }, [token, isSuperAdmin]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reminders/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (err) {
      setError('Failed to load reminder settings');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = () => {
    if (settings) {
      setSettings({
        ...settings,
        isEnabled: !settings.isEnabled,
      });
    }
  };

  const handleToggleReminder = (index: number) => {
    if (settings) {
      const newReminders = [...settings.reminders];
      newReminders[index].enabled = !newReminders[index].enabled;
      setSettings({
        ...settings,
        reminders: newReminders,
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setError('');
      setSuccess('');
      setSaving(true);

      const response = await fetch('/api/admin/reminders/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isEnabled: settings.isEnabled,
          reminders: settings.reminders,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSuccess('Reminder settings saved successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      logger.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setError('');
      setSuccess('');
      setSending(true);

      const response = await fetch('/api/admin/reminders/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRemindersSent(data.remindersSent);
        setSuccess(`Successfully sent ${data.remindersSent} reminders!`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send reminders');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      logger.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Only super admins can access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          Appointment Reminders
        </h1>
        <p className="text-gray-600 mt-1">Configure and manage automated appointment reminders</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">{success}</h3>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {settings && (
        <>
          {/* Enable/Disable */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={handleToggleEnabled}
                className="w-5 h-5 rounded"
              />
              <div>
                <h3 className="font-semibold text-gray-900">Enable Automated Reminders</h3>
                <p className="text-sm text-gray-600">Turn on/off all appointment reminders</p>
              </div>
            </label>
          </div>

          {/* Reminder Configurations */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reminder Schedules</h2>
              <p className="text-sm text-gray-600 mt-1">Configure when reminders should be sent</p>
            </div>

            <div className="divide-y divide-gray-200">
              {settings.reminders.map((reminder, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={reminder.enabled}
                        onChange={() => handleToggleReminder(index)}
                        className="w-5 h-5 rounded mt-1"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {reminder.hoursBeforeAppointment === 1
                            ? '1 Hour Before'
                            : `${reminder.hoursBeforeAppointment} Hours Before`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Send email reminder {reminder.hoursBeforeAppointment} hour{reminder.hoursBeforeAppointment > 1 ? 's' : ''} before appointment
                        </p>
                      </div>
                    </label>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reminder.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reminder.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSendReminders}
              disabled={sending || !settings.isEnabled}
              className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Send Reminders Now
                </>
              )}
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Automated reminders check for appointments that need notifications</li>
              <li>✓ Reminders are sent via email to registered users</li>
              <li>✓ You can manually trigger reminders using the "Send Reminders Now" button</li>
              <li>✓ Each user receives only one reminder per time period</li>
              <li>✓ Reminders are only sent for confirmed and pending appointments</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
