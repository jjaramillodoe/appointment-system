"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import ChartsTab from '@/components/admin/ChartsTab';
import TrendsTab from '@/components/admin/TrendsTab';
import InsightsTab from '@/components/admin/InsightsTab';
import { BarChart3, TrendingUp, Lightbulb, PieChart, Calendar, Users, Clock, Target, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const { token, isAdmin, isSuperAdmin } = useAuth();
  const { selectedHub } = useHubFilter();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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
        console.error('Failed to load analytics:', response.status);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, description: 'Key metrics and summary' },
    { id: 'charts', name: 'Interactive Charts', icon: PieChart, description: 'Visual data analysis' },
    { id: 'trends', name: 'Trends & Patterns', icon: TrendingUp, description: 'Time-based insights' },
    { id: 'insights', name: 'AI Insights', icon: Lightbulb, description: 'Predictive analytics' }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real-time analytics and appointment insights
          </p>
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

      {/* Key Metrics Cards */}
      {!loading && data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Appointments */}
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmed Appointments */}
          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.confirmed || 0}</p>
                  {data.stats.total > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {Math.round((data.stats.confirmed / data.stats.total) * 100)}% completion
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.pending || 0}</p>
                  {data.stats.total > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {Math.round((data.stats.pending / data.stats.total) * 100)}% pending
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancelled */}
          <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.cancelled || 0}</p>
                  {data.stats.total > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {Math.round((data.stats.cancelled / data.stats.total) * 100)}% cancelled
                    </p>
                  )}
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/40 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
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
              <TabsContent value="overview" className="mt-0">
                <AnalyticsTab
                  data={data}
                  loading={loading}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  selectedHub={selectedHub || 'all'}
                  setSelectedHub={() => {}} // Filter is managed by HubFilterContext
                  isSuperAdmin={isSuperAdmin}
                  assignedHubName={null} // Not needed, handled by context
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="charts" className="mt-0">
                <ChartsTab
                  data={data}
                  loading={loading}
                  selectedHub={selectedHub || 'all'}
                />
              </TabsContent>

              <TabsContent value="trends" className="mt-0">
                <TrendsTab
                  data={data}
                  loading={loading}
                  dateRange={dateRange}
                  selectedHub={selectedHub || 'all'}
                />
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <InsightsTab
                  data={data}
                  loading={loading}
                  selectedHub={selectedHub || 'all'}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 