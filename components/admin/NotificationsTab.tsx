"use client";

import { useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, Settings, Volume2, VolumeX, RefreshCw, Eye, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface NotificationsTabProps {
  notifications: any[];
  settings: any;
  setSettings: (settings: any) => void;
  onRefresh?: () => void;
}

export default function NotificationsTab({ notifications, settings, setSettings, onRefresh }: NotificationsTabProps) {
  const { token } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const markAsRead = async (notificationId: string) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationId,
          action: 'markRead'
        })
      });

      if (response.ok) {
        // Refresh notifications
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'markAllRead'
        })
      });

      if (response.ok) {
        // Refresh notifications
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error('Failed to mark all notifications as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_capacity': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'no_show': return <Clock className="h-5 w-5 text-red-500" />;
      case 'reminder': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_capacity': return 'bg-orange-50 border-orange-200';
      case 'no_show': return 'bg-red-50 border-red-200';
      case 'reminder': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Bell className="h-6 w-6 mr-2 text-primary" />
            Notifications Center
          </CardTitle>
          <CardDescription>Manage and view system notifications and alerts</CardDescription>
        </CardHeader>
      </Card>

      {/* Notification Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Alerts Active</p>
                <p className="text-2xl font-bold">
                  {Object.values(settings).filter(Boolean).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Alert Settings
              </CardTitle>
              <CardDescription className="mt-1">
                Configure notification preferences and alert types
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="low-capacity" className="text-base font-medium">Low Capacity Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when appointment slots are nearly full</p>
                </div>
                <Switch
                  id="low-capacity"
                  checked={settings.lowCapacityAlert}
                  onCheckedChange={(checked) => setSettings({ ...settings, lowCapacityAlert: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="no-show" className="text-base font-medium">No-Show Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track and report missed appointments</p>
                </div>
                <Switch
                  id="no-show"
                  checked={settings.noShowTracking}
                  onCheckedChange={(checked) => setSettings({ ...settings, noShowTracking: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="reminder" className="text-base font-medium">Reminder System</Label>
                  <p className="text-sm text-muted-foreground">Send automatic reminders before appointments</p>
                </div>
                <Switch
                  id="reminder"
                  checked={settings.reminderSystem}
                  onCheckedChange={(checked) => setSettings({ ...settings, reminderSystem: checked })}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Notifications</CardTitle>
            {notifications.filter(n => !n.read).length > 0 && (
              <Button
                onClick={markAllAsRead}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
          <CardDescription>
            {notifications.filter(n => !n.read).length} unread notification{notifications.filter(n => !n.read).length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`transition-all ${
                    !notification.read 
                      ? 'ring-2 ring-primary-200 border-primary-300 bg-primary/5' 
                      : ''
                  } ${getNotificationColor(notification.type)}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => markAsRead(notification._id)}
                        disabled={loading}
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                      >
                        {notification.read ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="text-lg mb-2">No Notifications</CardTitle>
              <CardDescription>You're all caught up! No new notifications at this time.</CardDescription>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common notification-related tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex items-start justify-start text-left hover:bg-muted/50 transition-colors"
            >
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Check Capacity</p>
                <p className="text-sm text-muted-foreground">View all low-capacity slots</p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex items-start justify-start text-left hover:bg-muted/50 transition-colors"
            >
              <Clock className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No-Show Report</p>
                <p className="text-sm text-muted-foreground">Generate no-show report</p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 flex items-start justify-start text-left hover:bg-muted/50 transition-colors"
            >
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Send Reminders</p>
                <p className="text-sm text-muted-foreground">Send appointment reminders</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 