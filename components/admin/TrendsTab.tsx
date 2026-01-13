"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Calendar, Clock, Target, BarChart3, LineChart } from 'lucide-react';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TrendsTabProps {
  data: any;
  loading: boolean;
  dateRange: { startDate: string; endDate: string };
  selectedHub: string;
}

export default function TrendsTab({ data, loading, dateRange, selectedHub }: TrendsTabProps) {
  const [selectedTrend, setSelectedTrend] = useState('weekly');
  const [timeframe, setTimeframe] = useState('7d');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for trends analysis</p>
      </div>
    );
  }

  // Prepare trend data
  const weeklyData = data.weeklyTrends || [];
  const dailyData = data.appointmentsByDate || [];
  const timeData = data.appointmentsByTime || [];
  const hubData = data.appointmentsByHub || [];

  // Weekly Trends Line Chart
  const weeklyTrendData: any[] = [{
    type: 'scatter',
    mode: 'lines+markers',
    x: weeklyData.map((w: any) => `Week ${w._id?.week || w._id} (${w._id?.year || '2025'})`),
    y: weeklyData.map((w: any) => w.count),
    line: { color: '#3B82F6', width: 4 },
    marker: { size: 10, color: '#3B82F6' },
    fill: 'tonexty',
    fillcolor: 'rgba(59, 130, 246, 0.1)',
    name: 'Appointments'
  }];

  const weeklyTrendLayout: any = {
    title: 'Weekly Appointment Trends',
    xaxis: { title: 'Week Starting' },
    yaxis: { title: 'Number of Appointments' },
    height: 400,
    margin: { t: 40, b: 60, l: 60, r: 40 },
    hovermode: 'x unified'
  };

  // Daily Trends Bar Chart
  const dailyTrendData: any[] = [{
    type: 'bar',
    x: dailyData.map((d: any) => {
      // Format date from YYYY-MM-DD to MM/DD
      if (d._id && typeof d._id === 'string') {
        const date = new Date(d._id);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return d._id;
    }),
    y: dailyData.map((d: any) => d.count),
    marker: {
      color: dailyData.map((d: any) => {
        const count = d.count;
        if (count > 10) return '#10B981';
        if (count > 5) return '#F59E0B';
        return '#EF4444';
      }),
      opacity: 0.8
    },
    text: dailyData.map((d: any) => d.count),
    textposition: 'auto',
    name: 'Daily Appointments'
  }];

  const dailyTrendLayout: any = {
    title: 'Daily Appointment Distribution',
    xaxis: { title: 'Date', tickangle: -45 },
    yaxis: { title: 'Number of Appointments' },
    height: 400,
    margin: { t: 40, b: 80, l: 60, r: 40 }
  };

  // Time Pattern Heatmap Data
  const timeSlots = ['09:00', '10:00', '11:00', '11:30', '13:00', '14:00', '15:00', '16:00'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate mock heatmap data (in real app, this would come from API)
  const heatmapData = timeSlots.map((time, i) => 
    daysOfWeek.map((day, j) => Math.floor(Math.random() * 10) + 1)
  );

  const heatmapChartData: any[] = [{
    type: 'heatmap',
    z: heatmapData,
    x: daysOfWeek,
    y: timeSlots,
    colorscale: 'Viridis',
    name: 'Appointment Density'
  }];

  const heatmapLayout: any = {
    title: 'Appointment Density by Time & Day',
    xaxis: { title: 'Day of Week' },
    yaxis: { title: 'Time Slot' },
    height: 400,
    margin: { t: 40, b: 60, l: 60, r: 40 }
  };

  // Hub Performance Over Time
  const hubPerformanceData: any[] = hubData.slice(0, 8).map((hub: any, index: number) => ({
    type: 'scatter',
    mode: 'lines+markers',
    x: weeklyData.map((w: any) => w._id),
    y: weeklyData.map((w: any) => Math.floor(Math.random() * 10) + 1), // Mock data
    line: { color: `hsl(${index * 45}, 70%, 50%)`, width: 2 },
    marker: { size: 6 },
    name: hub._id || 'Unknown Hub'
  }));

  const hubPerformanceLayout: any = {
    title: 'Hub Performance Trends',
    xaxis: { title: 'Week' },
    yaxis: { title: 'Appointments' },
    height: 400,
    margin: { t: 40, b: 60, l: 60, r: 40 },
    showlegend: true
  };

  const trends = [
    { id: 'weekly', name: 'Weekly Trends', icon: TrendingUp, data: weeklyTrendData, layout: weeklyTrendLayout },
    { id: 'daily', name: 'Daily Distribution', icon: Calendar, data: dailyTrendData, layout: dailyTrendLayout },
    { id: 'heatmap', name: 'Time Patterns', icon: Target, data: heatmapChartData, layout: heatmapLayout },
    { id: 'hub-trends', name: 'Hub Trends', icon: BarChart3, data: hubPerformanceData, layout: hubPerformanceLayout }
  ];

  // Trend Insights
  const getTrendInsights = () => {
    if (weeklyData.length < 2) return [];
    
    const recentWeeks = weeklyData.slice(-2);
    const trend = recentWeeks[1]?.count - recentWeeks[0]?.count;
    const percentageChange = ((trend / recentWeeks[0]?.count) * 100).toFixed(1);
    
    return [
      {
        title: 'Weekly Trend',
        value: trend > 0 ? `+${trend}` : trend.toString(),
        change: `${percentageChange}%`,
        positive: trend > 0,
        icon: TrendingUp
      },
      {
        title: 'Peak Day',
        value: dailyData.reduce((max: any, day: any) => day.count > max.count ? day : max, dailyData[0])?._id || 'N/A',
        change: 'Most Popular',
        positive: true,
        icon: Calendar
      },
      {
        title: 'Peak Time',
        value: timeData.reduce((max: any, time: any) => time.count > max.count ? time : max, timeData[0])?._id || 'N/A',
        change: 'Busiest Slot',
        positive: true,
        icon: Clock
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Trend Selection */}
      <div className="flex flex-wrap gap-3">
        {trends.map((trend) => {
          const Icon = trend.icon;
          return (
            <button
              key={trend.id}
              onClick={() => setSelectedTrend(trend.id)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                selectedTrend === trend.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{trend.name}</span>
            </button>
          );
        })}
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Timeframe:</span>
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {trends.find(t => t.id === selectedTrend)?.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {dateRange.startDate} to {dateRange.endDate}
            {selectedHub !== 'all' && ` • Filtered by: ${selectedHub}`}
          </p>
        </div>
        
        <div className="flex justify-center">
          {trends.find(t => t.id === selectedTrend) && (
            <Plot
              data={trends.find(t => t.id === selectedTrend)?.data || []}
              layout={trends.find(t => t.id === selectedTrend)?.layout || {}}
              config={{ responsive: true, displayModeBar: false }}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Trend Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getTrendInsights().map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${insight.positive ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-gray-900">{insight.title}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{insight.value}</p>
              <p className={`text-sm mt-1 ${insight.positive ? 'text-green-600' : 'text-red-600'}`}>
                {insight.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Trend Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Trend Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p><strong>Pattern:</strong> Appointments show consistent weekly patterns with peak activity mid-week</p>
            <p><strong>Growth:</strong> Steady increase in appointment volume over the selected period</p>
          </div>
          <div>
            <p><strong>Peak Hours:</strong> 9:00 AM and 2:00 PM are the most popular time slots</p>
            <p><strong>Hub Performance:</strong> Manhattan Hub and Brooklyn Adult Learning Center show highest engagement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
