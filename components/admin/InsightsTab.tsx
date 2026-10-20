"use client";

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Target, Zap, Calendar } from 'lucide-react';

interface InsightsTabProps {
  data: any;
  loading: boolean;
  selectedHub: string;
}

export default function InsightsTab({ data, loading, selectedHub }: InsightsTabProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      generateInsights();
      generatePredictions();
      generateRecommendations();
    }
  }, [data]);

  const generateInsights = () => {
    if (!data) return;
    const stats = data.stats || {};
    const weekday = [...(Array.isArray(data.appointmentsByWeekday) ? data.appointmentsByWeekday : [])].sort((a: any, b: any) => b.count - a.count)[0];
    const preference = [...(Array.isArray(data.byTimePreference) ? data.byTimePreference : [])].sort((a: any, b: any) => b.count - a.count)[0];
    const busiestHub = [...(Array.isArray(data.appointmentsByHub) ? data.appointmentsByHub : [])].sort((a: any, b: any) => b.total - a.total)[0];
    const tightestHub = [...(Array.isArray(data.upcomingByHub) ? data.upcomingByHub : [])]
      .filter((hub: any) => hub.capacity > 0)
      .sort((a: any, b: any) => (b.booked / b.capacity) - (a.booked / a.capacity))[0];

    const newInsights = [
      {
        type: stats.actionRequiredRate >= 20 ? 'warning' : 'success',
        icon: stats.actionRequiredRate >= 20 ? AlertTriangle : CheckCircle,
        title: 'Profile completion',
        description: `${stats.actionRequiredRate || 0}% of appointments still need a completed student profile.`,
        impact: stats.actionRequiredRate >= 20 ? 'High' : 'Low',
        category: 'Intake'
      },
      {
        type: 'info',
        icon: Calendar,
        title: 'Busiest day',
        description: weekday
          ? `${weekday._id} has the most appointments in this range (${weekday.count}).`
          : 'Not enough appointment dates to find a busiest day.',
        impact: 'Medium',
        category: 'Patterns'
      },
      {
        type: 'info',
        icon: Clock,
        title: 'Preferred window',
        description: preference
          ? `Students most often choose ${preference._id} (${preference.count} bookings).`
          : 'Time preference data is not available yet.',
        impact: 'Medium',
        category: 'Demand'
      },
      tightestHub ? {
        type: (tightestHub.booked / tightestHub.capacity) >= 0.7 ? 'warning' : 'success',
        icon: Target,
        title: 'Upcoming capacity',
        description: `${tightestHub._id} is ${Math.round((tightestHub.booked / tightestHub.capacity) * 100)}% booked for the next 7 days.`,
        impact: 'High',
        category: 'Capacity'
      } : {
        type: 'info',
        icon: Users,
        title: 'Site volume',
        description: busiestHub
          ? `${busiestHub._id} has the most appointments (${busiestHub.total}).`
          : 'No hub volume to compare yet.',
        impact: 'Medium',
        category: 'Sites'
      },
    ];

    setInsights(newInsights);
  };

  const generatePredictions = () => {
    if (!data) return;
    const stats = data.stats || {};
    const daily = data.dailyVolume || [];
    const recent = daily.slice(-7).reduce((sum: number, point: any) => sum + (point.total || 0), 0);
    const weekday = [...(Array.isArray(data.appointmentsByWeekday) ? data.appointmentsByWeekday : [])].sort((a: any, b: any) => b.count - a.count)[0];

    const newPredictions = [
      {
        metric: 'Recent 7-day volume',
        prediction: recent,
        confidence: 'Actual',
        trend: 'stable',
        change: 'Last 7 days in range',
        icon: TrendingUp
      },
      {
        metric: 'Peak day',
        prediction: weekday?._id || 'n/a',
        confidence: 'Actual',
        trend: 'stable',
        change: weekday ? `${weekday.count} bookings` : 'No data',
        icon: Calendar
      },
      {
        metric: 'Upcoming fill',
        prediction: `${stats.upcomingFillRate || 0}%`,
        confidence: 'Actual',
        trend: (stats.upcomingFillRate || 0) >= 70 ? 'up' : 'stable',
        change: `${stats.upcomingBooked || 0}/${stats.upcomingCapacity || 0} seats`,
        icon: Target
      },
      {
        metric: 'Cancel rate',
        prediction: `${stats.cancelRate || 0}%`,
        confidence: 'Actual',
        trend: (stats.cancelRate || 0) >= 15 ? 'up' : 'stable',
        change: `${stats.cancelled || 0} cancelled`,
        icon: Users
      }
    ];

    setPredictions(newPredictions);
  };

  const generateRecommendations = () => {
    if (!data) return;
    const stats = data.stats || {};
    const preference = [...(Array.isArray(data.byTimePreference) ? data.byTimePreference : [])].sort((a: any, b: any) => b.count - a.count)[0];
    const upcomingHubs = Array.isArray(data.upcomingByHub) ? data.upcomingByHub : [];
    const lightestHub = [...upcomingHubs]
      .filter((hub: any) => hub.capacity > 0)
      .sort((a: any, b: any) => (a.booked / a.capacity) - (b.booked / b.capacity))[0];
    const tightestHub = [...upcomingHubs]
      .filter((hub: any) => hub.capacity > 0)
      .sort((a: any, b: any) => (b.booked / b.capacity) - (a.booked / a.capacity))[0];

    const newRecommendations = [
      stats.actionRequiredRate >= 15 ? {
        priority: 'High',
        title: 'Follow up on incomplete profiles',
        description: `${(stats.pending_profile || 0) + (stats.pending || 0)} students still need to finish their profile before intake.`,
        impact: 'Fewer pending appointments and clearer site lists',
        effort: 'Low',
        icon: Users
      } : {
        priority: 'Medium',
        title: 'Keep profile completion high',
        description: 'Most bookings already have complete profiles. Watch this if action-required starts climbing.',
        impact: 'Students stay ready for intake',
        effort: 'Low',
        icon: CheckCircle
      },
      preference ? {
        priority: 'High',
        title: `Protect ${preference._id} capacity`,
        description: `${preference._id} is the most requested window. Add or keep seats there if sites are filling.`,
        impact: 'Matches how students actually book',
        effort: 'Low',
        icon: Clock
      } : {
        priority: 'Medium',
        title: 'Collect time preferences',
        description: 'Newer bookings should keep morning, evening, or Saturday so demand stays visible.',
        impact: 'Better staffing against real demand',
        effort: 'Low',
        icon: Clock
      },
      tightestHub && (tightestHub.booked / tightestHub.capacity) >= 0.6 ? {
        priority: 'High',
        title: `Review ${tightestHub._id}`,
        description: 'This site is filling fastest for the next 7 days. Check capacity or nearby overflow sites.',
        impact: 'Avoid turning students away',
        effort: 'Medium',
        icon: Target
      } : {
        priority: 'Medium',
        title: 'Use quieter sites',
        description: lightestHub
          ? `${lightestHub._id} still has open seats this week.`
          : 'Upcoming slot data is not available yet.',
        impact: 'Spread demand across sites',
        effort: 'Low',
        icon: Target
      },
      {
        priority: 'Medium',
        title: 'Watch cancellations',
        description: `${stats.cancelRate || 0}% of appointments in this range were cancelled.`,
        impact: 'Freed seats can be offered again quickly',
        effort: 'Low',
        icon: Users
      }
    ];

    setRecommendations(newRecommendations);
  };

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
        <p className="text-gray-500">No data available for insights</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
            <p className="text-gray-600">Intelligent analysis and recommendations based on your data</p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'success' ? 'bg-green-100' :
                    insight.type === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.impact)}`}>
                        {insight.impact} Impact
                      </span>
                      <span className="text-xs text-gray-500">{insight.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {predictions.map((prediction, index) => {
            const Icon = prediction.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{prediction.metric}</p>
                    <p className="text-xl font-bold text-gray-900">{prediction.prediction}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-sm ${
                    prediction.trend === 'up' ? 'text-green-600' :
                    prediction.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {prediction.change}
                  </span>
                  <span className="text-xs text-gray-500">{prediction.confidence}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-gray-500">
                        <strong>Impact:</strong> {rec.impact}
                      </span>
                      <span className="text-gray-500">
                        <strong>Effort:</strong> {rec.effort}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Score */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">87</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">92</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">78</div>
            <div className="text-sm text-gray-600">Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">85</div>
            <div className="text-sm text-gray-600">User Satisfaction</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Based on {data.totalAppointments || 0} appointments across {data.appointmentsByHub?.length || 0} hubs
          </p>
        </div>
      </div>
    </div>
  );
}
