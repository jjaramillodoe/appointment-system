"use client";

import { useState } from 'react';
import { FileText, Download, Calendar, Users, BarChart3, Filter, Clock, TrendingUp, CheckCircle, XCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { useHubFilter } from '@/contexts/HubFilterContext';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ReportsTabProps {
  reports: any[];
  filters: any;
  setFilters: (filters: any) => void;
  onRefresh?: () => void;
  stats?: any;
}

export default function ReportsTab({ reports, filters, setFilters, onRefresh, stats }: ReportsTabProps) {
  const { selectedHub } = useHubFilter();
  const { toasts, showSuccess, showError, showInfo } = useToast();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isFiltered, setIsFiltered] = useState(false);

  const reportTypes = [
    {
      id: 'appointments',
      name: 'Appointment Report',
      description: 'Detailed appointment statistics and trends',
      icon: Calendar,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100'
    },
    {
      id: 'users',
      name: 'User Demographics',
      description: 'User statistics and demographic analysis',
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    {
      id: 'hubs',
      name: 'Hub Performance',
      description: 'Hub utilization and performance metrics',
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    {
      id: 'capacity',
      name: 'Capacity Analysis',
      description: 'Slot capacity and utilization reports',
      icon: TrendingUp,
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100'
    }
  ];

  const generateReport = async (type: string) => {
    setGeneratingReport(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Authentication required. Please log in again.');
        return;
      }

      const reportName = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`;
      
      const parameters: any = {};
      if (dateRange.startDate) parameters.startDate = dateRange.startDate;
      if (dateRange.endDate) parameters.endDate = dateRange.endDate;
      if (selectedHub && selectedHub !== 'all') parameters.hubName = selectedHub;

      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          name: reportName,
          parameters
        })
      });

      if (response.ok) {
        showSuccess('Report generation started! Check back in a few moments.');
        // Reset form
        setSelectedReportType('');
        setDateRange({ startDate: '', endDate: '' });
        // Refresh reports list after a short delay
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 1000);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Report downloaded successfully!');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      showError('Failed to download report. Please try again.');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    // Hub filter is managed centrally by HubFilterContext, so we don't need to check it here
    setFilters(newFilters);
    setIsFiltered(!!(newFilters.type || newFilters.dateRange || newFilters.hubName));
    if (onRefresh) {
      onRefresh();
    }
  };

  const clearFilters = () => {
    const clearedFilters = { type: '', dateRange: '', hubName: '' };
    setFilters(clearedFilters);
    setIsFiltered(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Download className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'failed': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    if (filters.type && report.type !== filters.type) return false;
    if (filters.hubName && report.parameters?.hubName && report.parameters.hubName !== filters.hubName) return false;
    return true;
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 opacity-90" />
              <span className="text-2xl font-bold">{stats.total || 0}</span>
            </div>
            <p className="text-primary-100 text-sm font-medium">Total Reports</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 opacity-90" />
              <span className="text-2xl font-bold">{stats.ready || 0}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Ready</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 opacity-90" />
              <span className="text-2xl font-bold">{stats.processing || 0}</span>
            </div>
            <p className="text-yellow-100 text-sm font-medium">Processing</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-8 w-8 opacity-90" />
              <span className="text-2xl font-bold">{stats.failed || 0}</span>
            </div>
            <p className="text-red-100 text-sm font-medium">Failed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 via-primary-500 to-yellow-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-8 w-8 opacity-90" />
              <span className="text-2xl font-bold">{stats.byType?.appointments || 0}</span>
            </div>
            <p className="text-white/90 text-sm font-medium">Appointments</p>
          </div>
        </div>
      )}

      {/* Report Generation */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="relative mr-3">
              <div className="absolute inset-0 bg-primary-200 rounded-full blur-lg opacity-50"></div>
              <FileText className="relative h-8 w-8 text-primary-600" />
            </div>
            Generate New Report
          </h3>
          <Button
            onClick={() => onRefresh && onRefresh()}
            variant="outline"
            size="sm"
            title="Refresh reports"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((reportType) => {
            const Icon = reportType.icon;
            const isSelected = selectedReportType === reportType.id;
            return (
              <div
                key={reportType.id}
                className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                  isSelected
                    ? `border-primary-500 bg-gradient-to-br ${reportType.bgGradient} shadow-lg scale-105`
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedReportType(reportType.id)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${reportType.gradient} transform transition-transform duration-300 ${isSelected ? 'scale-110 rotate-6' : 'group-hover:scale-105'}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className={`ml-4 font-bold text-lg flex-1 ${isSelected ? 'text-primary-900' : 'text-gray-900 group-hover:text-primary-700'}`}>
                    {reportType.name}
                  </h4>
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                  {reportType.description}
                </p>
              </div>
            );
          })}
        </div>

        {selectedReportType && (
          <div className={`mt-6 p-6 bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl shadow-sm transition-all duration-300 ${
            selectedReportType ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-primary-900 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-600" />
                Report Options
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hub (Optional)</label>
                <div className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {selectedHub === 'all' || !selectedHub ? 'All Hubs (select from top filter)' : selectedHub}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => generateReport(selectedReportType)}
                  disabled={generatingReport}
                  className="w-full"
                  size="lg"
                >
                  {generatingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="relative mr-3">
              <div className="absolute inset-0 bg-primary-200 rounded-full blur-lg opacity-50"></div>
              <Filter className="relative h-8 w-8 text-primary-600" />
            </div>
            Report Filters
          </h3>
          {isFiltered && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
            >
              <option value="">All Types</option>
              <option value="appointments">Appointments</option>
              <option value="users">Users</option>
              <option value="hubs">Hubs</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hub</label>
            <div className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {selectedHub === 'all' || !selectedHub ? 'All Hubs (select from top filter)' : selectedHub}
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-primary-600" />
            Generated Reports
            {filteredReports.length > 0 && (
              <span className="ml-3 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {filteredReports.length}
              </span>
            )}
          </h3>
        </div>
        
        {filteredReports.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary-600 to-primary-500 hover:bg-gradient-to-r hover:from-primary-600 hover:to-primary-500">
                  <TableHead className="text-white font-bold">Report Name</TableHead>
                  <TableHead className="text-white font-bold">Type</TableHead>
                  <TableHead className="text-white font-bold">Generated</TableHead>
                  <TableHead className="text-white font-bold">Status</TableHead>
                  <TableHead className="text-white font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report, index) => (
                  <TableRow 
                    key={report._id}
                    className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-yellow-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold">{report.name}</div>
                          <div className="text-sm text-muted-foreground">By: {report.generatedBy}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{report.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          report.status === 'ready' ? 'default' :
                          report.status === 'processing' ? 'secondary' :
                          'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.status === 'ready' && (
                        <Button
                          onClick={() => downloadReport(report._id)}
                          size="sm"
                          variant="default"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {report.status === 'processing' && (
                        <div className="flex items-center text-muted-foreground">
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </div>
                      )}
                      {report.status === 'failed' && (
                        <Button
                          onClick={() => generateReport(report.type)}
                          size="sm"
                          variant="destructive"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary-200 rounded-full blur-2xl opacity-30"></div>
              <FileText className="relative h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-6">
              {isFiltered 
                ? 'No reports match your current filters. Try adjusting your search criteria.'
                : 'Generate your first report to get started with insights and analytics.'}
            </p>
            {isFiltered && (
              <Button
                onClick={clearFilters}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Report Templates */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-primary-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Sparkles className="h-8 w-8 mr-3 text-yellow-600" />
          Quick Report Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange({ startDate: today, endDate: today });
              setSelectedReportType('appointments');
              generateReport('appointments');
            }}
            className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1 bg-gradient-to-br from-primary-50 to-transparent hover:from-primary-100"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">Daily Summary</p>
                <p className="text-sm text-gray-600">Today's appointments overview</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="h-4 w-4 text-primary-600" />
            </div>
          </button>
          
          <button
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              setDateRange({ 
                startDate: weekAgo.toISOString().split('T')[0], 
                endDate: today.toISOString().split('T')[0] 
              });
              setSelectedReportType('appointments');
              generateReport('appointments');
            }}
            className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1 bg-gradient-to-br from-green-50 to-transparent hover:from-green-100"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors duration-300">Weekly Trends</p>
                <p className="text-sm text-gray-600">Appointment patterns</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="h-4 w-4 text-green-600" />
            </div>
          </button>
          
          <button
            onClick={() => {
              setSelectedReportType('capacity');
              generateReport('capacity');
            }}
            className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-transparent hover:from-purple-100"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors duration-300">Capacity Report</p>
                <p className="text-sm text-gray-600">Slot utilization analysis</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="h-4 w-4 text-purple-600" />
            </div>
          </button>
          
          <button
            onClick={() => {
              setSelectedReportType('users');
              generateReport('users');
            }}
            className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-transparent hover:from-yellow-100"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-bold text-gray-900 mb-1 group-hover:text-yellow-700 transition-colors duration-300">User Insights</p>
                <p className="text-sm text-gray-600">Demographic analysis</p>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="h-4 w-4 text-yellow-600" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 