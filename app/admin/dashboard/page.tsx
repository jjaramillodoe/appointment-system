"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import InsightsTab from '@/components/admin/InsightsTab';
import DashboardCharts from '@/components/admin/DashboardCharts';
import TabErrorBoundary from '@/components/admin/TabErrorBoundary';
import { BarChart3, Lightbulb, Calendar, Users, Target, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { hubCalendarDaysAgo, hubCalendarToday } from '@/lib/slotDateTime';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const { token, isAdmin, isSuperAdmin } = useAuth();
  const { selectedHub, hubName } = useHubFilter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'insights') {
      setActiveTab('overview');
    }
  }, [activeTab]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: hubCalendarDaysAgo(30),
    endDate: hubCalendarToday()
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (token && isAdmin) {
      loadAnalytics();
    }
  }, [token, isAdmin, dateRange, selectedHub, refreshKey]);

  const loadAnalytics = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        hubName: selectedHub === 'all' || !selectedHub ? '' : selectedHub
      });

      const response = await fetch(`/api/admin/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        logger.error('Failed to load analytics:', response.status);
      }
    } catch (error) {
      logger.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'insights', name: 'Insights', icon: Lightbulb },
  ];

  if (!token || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            {hubName && !isSuperAdmin
              ? `Operations and booking trends for ${hubName}`
              : selectedHub && selectedHub !== 'all'
              ? `Operations and booking trends for ${selectedHub}`
              : 'System-wide operations and booking trends'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            size="lg"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!isSuperAdmin && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium text-primary-900">Today at your site</p>
              <p className="text-2xl font-bold">{data?.stats?.todayCount || 0} students on the roster</p>
              <p className="text-sm text-muted-foreground">
                Next 7 days fill: {data?.stats?.upcomingFillRate || 0}%
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/dashboard/appointments">Open today’s intake queue</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Appointments</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.stats.todayCount || 0} on the calendar today
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.confirmed || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {data.stats.confirmationRate || 0}% of this range
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action required</p>
                  <p className="text-3xl font-bold mt-2">{(data.stats.pending_profile || 0) + (data.stats.pending || 0)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {data.stats.actionRequiredRate || 0}% still need a complete profile
                  </p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next 7 days fill</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.upcomingFillRate || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.stats.upcomingBooked || 0} of {data.stats.upcomingCapacity || 0} seats booked
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Loading dashboard charts...
          </CardContent>
        </Card>
      )}

      {!loading && data && (
        <DashboardCharts
          data={data}
          isSuperAdmin={isSuperAdmin}
          selectedHub={selectedHub || 'all'}
        />
      )}

      {/* Detailed Analytics Tabs */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/40 px-6 pt-6">
              <TabsList className="grid h-auto w-full grid-cols-2 bg-transparent gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-6">
              <TabErrorBoundary>
                {activeTab === 'overview' && (
                  <AnalyticsTab
                    data={data}
                    loading={loading}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedHub={selectedHub || 'all'}
                    setSelectedHub={() => {}}
                    isSuperAdmin={isSuperAdmin}
                    assignedHubName={hubName}
                    onRefresh={handleRefresh}
                  />
                )}
                {activeTab === 'insights' && (
                  <InsightsTab
                    data={data}
                    loading={loading}
                    selectedHub={selectedHub || 'all'}
                  />
                )}
              </TabErrorBoundary>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 