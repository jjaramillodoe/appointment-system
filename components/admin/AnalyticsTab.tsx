"use client";

import { BarChart3, Users, Calendar, TrendingUp, MapPin, Clock, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { useHubs } from '@/hooks/useHubs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsTabProps {
  data: any;
  loading: boolean;
  dateRange: { startDate: string; endDate: string };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  selectedHub: string | null;
  setSelectedHub: (hub: string) => void;
  onRefresh: () => void;
  isSuperAdmin?: boolean;
  assignedHubName?: string | null;
}

export default function AnalyticsTab({ data, loading, dateRange, setDateRange, selectedHub, setSelectedHub, onRefresh, isSuperAdmin = false, assignedHubName = null }: AnalyticsTabProps) {
  const { hubs, loading: hubsLoading } = useHubs();
  
  const handleHubChange = (value: string) => {
    // Prevent hub admins from changing the hub filter
    if (!isSuperAdmin && assignedHubName) {
      return; // Don't allow hub admins to change their assigned hub
    }
    setSelectedHub(value);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No Analytics Data</CardTitle>
          <CardDescription>Start by configuring your system and creating appointments.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const { stats, appointmentsByHub, appointmentsByTime, weeklyTrends, userDemographics, programInterests, barriersToLearning, capacityUtilization, recentAppointments, todaysAppointments } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Adjust date range and hub selection to filter analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            {/* Hub filter removed - now handled by HubFilterBar at top */}
            <div className="flex items-end">
              <Button
                onClick={onRefresh}
                className="w-full"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats?.confirmed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{stats?.cancelled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Hub Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
            {appointmentsByHub?.map((hub: any) => (
              <div key={hub._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{hub._id}</span>
                  <span className="text-sm text-gray-600">{hub.total} total</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(hub.confirmed / hub.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round((hub.confirmed / hub.total) * 100)}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Confirmed: {hub.confirmed}</span>
                  <span>Pending: {hub.pending}</span>
                  <span>Cancelled: {hub.cancelled}</span>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Slot Popularity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Time Slot Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            {appointmentsByTime?.slice(0, 8).map((slot: any) => (
              <div key={slot._id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{slot._id}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((slot.count / Math.max(...appointmentsByTime.map((s: any) => s.count))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{slot.count}</span>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Education Levels</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            {userDemographics?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{item._id}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
            {programInterests?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{item._id}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Barriers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
            {barriersToLearning?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{item._id}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest appointment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {recentAppointments?.slice(0, 5).map((appointment: any) => (
            <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {appointment.userId?.firstName} {appointment.userId?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {appointment.hubId?.name || 'Unknown Hub'} • {appointment.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={
                    appointment.status === 'confirmed' ? 'default' :
                    appointment.status === 'pending' ? 'secondary' :
                    'destructive'
                  }
                >
                  {appointment.status}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(appointment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
            </div>
          </CardContent>
        </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>Scheduled appointments for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysAppointments?.length > 0 ? (
            <div className="space-y-3">
              {todaysAppointments.map((appointment: any) => (
                <div key={appointment._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {appointment.userId?.firstName} {appointment.userId?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.hubId?.name || 'Unknown Hub'} • {appointment.time}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      appointment.status === 'confirmed' ? 'default' :
                      appointment.status === 'pending' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No appointments scheduled for today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 