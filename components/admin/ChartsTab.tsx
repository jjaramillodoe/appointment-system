"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, PieChart, TrendingUp, Calendar, Users, Clock } from 'lucide-react';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartsTabProps {
  data: any;
  loading: boolean;
  selectedHub: string;
}

export default function ChartsTab({ data, loading, selectedHub }: ChartsTabProps) {
  const [selectedChart, setSelectedChart] = useState('status');

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
        <p className="text-gray-500">No data available for charts</p>
      </div>
    );
  }

  // Debug: Log the data structure
  console.log('ChartsTab Data:', {
    stats: data.stats,
    appointmentStats: data.appointmentStats,
    weeklyTrends: data.weeklyTrends,
    appointmentsByTime: data.appointmentsByTime,
    appointmentsByHub: data.appointmentsByHub
  });

  // Prepare data for charts
  const statusData = data.stats ? [
    { _id: 'confirmed', count: data.stats.confirmed || 0 },
    { _id: 'pending', count: data.stats.pending || 0 },
    { _id: 'cancelled', count: data.stats.cancelled || 0 },
    { _id: 'completed', count: data.stats.completed || 0 }
  ].filter(s => s.count > 0) : [];
  
  const hubData = data.appointmentsByHub || [];
  const timeData = data.appointmentsByTime || [];
  const weeklyData = data.weeklyTrends || [];

  // Status Distribution Pie Chart
  const statusPieData: any[] = [{
    type: 'pie',
    labels: statusData.map((s: any) => s._id),
    values: statusData.map((s: any) => s.count),
    hole: 0.4,
    marker: {
      colors: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
    },
    textinfo: 'label+percent',
    textposition: 'outside'
  }];

  const statusPieLayout: any = {
    title: 'Appointment Status Distribution',
    showlegend: true,
    height: 400,
    margin: { t: 40, b: 40, l: 40, r: 40 }
  };

  // Hub Performance Bar Chart
  const hubBarData: any[] = [{
    type: 'bar',
    x: hubData.map((h: any) => h._id || 'Unknown'),
    y: hubData.map((h: any) => h.total),
    marker: {
      color: hubData.map((h: any) => {
        const total = h.total;
        if (total > 20) return '#10B981';
        if (total > 10) return '#F59E0B';
        return '#EF4444';
      })
    },
    text: hubData.map((h: any) => h.total),
    textposition: 'auto'
  }];

  const hubBarLayout: any = {
    title: 'Appointments by Hub',
    xaxis: { title: 'Hub Name', tickangle: -45 },
    yaxis: { title: 'Number of Appointments' },
    height: 400,
    margin: { t: 40, b: 80, l: 60, r: 40 }
  };

  // Time Slot Popularity Bar Chart
  const timeBarData: any[] = [{
    type: 'bar',
    x: timeData.map((t: any) => t._id),
    y: timeData.map((t: any) => t.count),
    marker: {
      color: '#3B82F6',
      opacity: 0.8
    },
    text: timeData.map((t: any) => t.count),
    textposition: 'auto'
  }];

  const timeBarLayout: any = {
    title: 'Appointment Time Popularity',
    xaxis: { title: 'Time Slot' },
    yaxis: { title: 'Number of Appointments' },
    height: 400,
    margin: { t: 40, b: 60, l: 60, r: 40 }
  };

  // Weekly Trends Line Chart
  const weeklyLineData: any[] = [{
    type: 'scatter',
    mode: 'lines+markers',
    x: weeklyData.map((w: any) => `Week ${w._id?.week || w._id} (${w._id?.year || '2025'})`),
    y: weeklyData.map((w: any) => w.count),
    line: { color: '#8B5CF6', width: 3 },
    marker: { size: 8, color: '#8B5CF6' },
    fill: 'tonexty',
    fillcolor: 'rgba(139, 92, 246, 0.1)'
  }];

  const weeklyLineLayout: any = {
    title: 'Weekly Appointment Trends',
    xaxis: { title: 'Week' },
    yaxis: { title: 'Number of Appointments' },
    height: 400,
    margin: { t: 40, b: 60, l: 60, r: 40 }
  };

  const charts = [
    { id: 'status', name: 'Status Distribution', icon: PieChart, data: statusPieData, layout: statusPieLayout },
    { id: 'hub', name: 'Hub Performance', icon: BarChart3, data: hubBarData, layout: hubBarLayout },
    { id: 'time', name: 'Time Popularity', icon: Clock, data: timeBarData, layout: timeBarLayout },
    { id: 'trends', name: 'Weekly Trends', icon: TrendingUp, data: weeklyLineData, layout: weeklyLineLayout }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Selection */}
      <div className="flex flex-wrap gap-3">
        {charts.map((chart) => {
          const Icon = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setSelectedChart(chart.id)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                selectedChart === chart.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{chart.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {charts.find(c => c.id === selectedChart)?.name}
          </h3>
          {selectedHub !== 'all' && (
            <p className="text-sm text-gray-600 mt-1">
              Filtered by: {selectedHub}
            </p>
          )}
        </div>
        
        <div className="flex justify-center">
          {charts.find(c => c.id === selectedChart) && (
            <Plot
              data={charts.find(c => c.id === selectedChart)?.data || []}
              layout={charts.find(c => c.id === selectedChart)?.layout || {}}
              config={{ responsive: true, displayModeBar: false }}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Chart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Total Appointments</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {data.totalAppointments || 0}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Active Hubs</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {hubData.length || 0}
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900">Time Slots</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            {timeData.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
