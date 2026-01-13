"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import ChartsTab from '@/components/admin/ChartsTab';
import TrendsTab from '@/components/admin/TrendsTab';
import InsightsTab from '@/components/admin/InsightsTab';
import { BarChart3, TrendingUp, Lightbulb, PieChart, Calendar, Users, Clock, Target, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const { token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedHub, setSelectedHub] = useState('all');
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
        hubId: selectedHub === 'all' ? '' : selectedHub
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Admin Dashboard
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Comprehensive analytics and insights for your appointment system
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
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
                  selectedHub={selectedHub} 
                  setSelectedHub={setSelectedHub}
                  onRefresh={handleRefresh}
                />
              </TabsContent>
              
              <TabsContent value="charts" className="mt-0">
                <ChartsTab 
                  data={data} 
                  loading={loading}
                  selectedHub={selectedHub}
                />
              </TabsContent>
              
              <TabsContent value="trends" className="mt-0">
                <TrendsTab 
                  data={data} 
                  loading={loading}
                  dateRange={dateRange}
                  selectedHub={selectedHub}
                />
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0">
                <InsightsTab 
                  data={data} 
                  loading={loading}
                  selectedHub={selectedHub}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 