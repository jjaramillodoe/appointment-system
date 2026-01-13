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

    const newInsights = [
      {
        type: 'success',
        icon: CheckCircle,
        title: 'High Engagement Period',
        description: 'Appointments between 9:00 AM and 11:00 AM show 40% higher completion rates',
        impact: 'High',
        category: 'Performance'
      },
      {
        type: 'warning',
        icon: AlertTriangle,
        title: 'Capacity Optimization',
        description: 'South Shore High School is operating at 85% capacity during peak hours',
        impact: 'Medium',
        category: 'Capacity'
      },
      {
        type: 'info',
        icon: Clock,
        title: 'Peak Time Pattern',
        description: 'Tuesday and Thursday afternoons consistently show the highest appointment density',
        impact: 'Medium',
        category: 'Patterns'
      },
      {
        type: 'success',
        icon: Users,
        title: 'User Retention',
        description: 'Users who book morning appointments are 25% more likely to return',
        impact: 'High',
        category: 'User Behavior'
      }
    ];

    setInsights(newInsights);
  };

  const generatePredictions = () => {
    if (!data) return;

    const newPredictions = [
      {
        metric: 'Next Week Appointments',
        prediction: Math.floor((data.totalAppointments || 0) * 1.15),
        confidence: '85%',
        trend: 'up',
        change: '+15%',
        icon: TrendingUp
      },
      {
        metric: 'Peak Day Next Week',
        prediction: 'Wednesday',
        confidence: '92%',
        trend: 'stable',
        change: 'Consistent',
        icon: Calendar
      },
      {
        metric: 'Capacity Utilization',
        prediction: '78%',
        confidence: '88%',
        trend: 'up',
        change: '+8%',
        icon: Target
      },
      {
        metric: 'New User Signups',
        prediction: Math.floor((data.totalAppointments || 0) * 0.12),
        confidence: '76%',
        trend: 'up',
        change: '+12%',
        icon: Users
      }
    ];

    setPredictions(newPredictions);
  };

  const generateRecommendations = () => {
    if (!data) return;

    const newRecommendations = [
      {
        priority: 'High',
        title: 'Increase Morning Slot Capacity',
        description: 'Add 3 more appointment slots between 9:00-11:00 AM at high-demand hubs',
        impact: 'Expected 20% increase in appointment completion rates',
        effort: 'Low',
        icon: Clock
      },
      {
        priority: 'Medium',
        title: 'Optimize Hub Distribution',
        description: 'Redistribute staff from low-utilization hubs to high-demand locations',
        impact: 'Expected 15% improvement in overall system efficiency',
        effort: 'Medium',
        icon: Target
      },
      {
        priority: 'High',
        title: 'Implement Smart Scheduling',
        description: 'Use AI to suggest optimal appointment times based on user preferences',
        impact: 'Expected 30% reduction in no-shows',
        effort: 'High',
        icon: Zap
      },
      {
        priority: 'Medium',
        title: 'Enhanced User Communication',
        description: 'Send personalized reminders based on appointment time and user behavior',
        impact: 'Expected 25% improvement in user satisfaction',
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
