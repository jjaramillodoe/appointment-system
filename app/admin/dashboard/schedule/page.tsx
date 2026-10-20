"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Check, X, ToggleLeft, ToggleRight, Building2, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';
import { DAY_OFF_CATEGORIES, buildDayOffReason, splitDayOffReason } from '@/lib/dayOffReason';

interface DayOffInfo {
  isOff: boolean;
  reason?: string;
}

interface DayOffStatus {
  [hubName: string]: {
    [date: string]: DayOffInfo;
  };
}

export default function SchedulePage() {
  const { token, isAdmin } = useAuth();
  const { selectedHub } = useHubFilter();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [daysOff, setDaysOff] = useState<DayOffStatus>({});
  const [loading, setLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{ date: string; existingReason?: string } | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string>(DAY_OFF_CATEGORIES[0].value);
  const [reasonDetails, setReasonDetails] = useState('');

  // Hub filter is now managed by HubFilterContext

  // Load day-off status for current week when hub changes
  useEffect(() => {
    if (selectedHub && selectedHub !== 'all') {
      loadDayOffStatus();
    }
  }, [selectedHub, currentWeek]);

  const loadDayOffStatus = async () => {
    if (!selectedHub || selectedHub === 'all') return;
    
    setLoading(true);
    try {
      // Get hub ID first
      const hubsResponse = await fetch('/api/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!hubsResponse.ok) {
        throw new Error('Failed to fetch hubs');
      }
      const hubsData = await hubsResponse.json();
      const hub = hubsData.find((h: any) => h.name === selectedHub);
      
      if (!hub) {
        logger.error('Hub not found:', selectedHub);
        return;
      }

      // Get week dates
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        weekDates.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
      }

      // Check availability for each day
      const dayOffData: { [date: string]: DayOffInfo } = {};
      
      for (const date of weekDates) {
        try {
          const response = await fetch(`/api/availability?hubId=${hub._id}&date=${date}`);
          if (response.ok) {
            const data = await response.json();
            dayOffData[date] = {
              isOff: data.data?.isDayOff || false,
              reason: data.data?.dayOffReason || '',
            };
          }
        } catch (error) {
          logger.error(`Error checking day off status for ${date}:`, error);
          dayOffData[date] = { isOff: false };
        }
      }

      setDaysOff(prev => ({
        ...prev,
        [selectedHub]: dayOffData
      }));
    } catch (error) {
      logger.error('Error loading day off status:', error);
      setUpdateStatus({
        message: 'Failed to load schedule data',
        type: 'error'
      });
      setTimeout(() => setUpdateStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const openReasonDialog = (date: string, existingReason?: string) => {
    const parsed = splitDayOffReason(existingReason);
    setReasonCategory(parsed.category);
    setReasonDetails(parsed.details);
    setReasonDialog({ date, existingReason });
  };

  const updateDay = async (date: string, action: 'markDayOff' | 'markDayOpen', reason?: string) => {
    if (!selectedHub || selectedHub === 'all') return;

    setLoading(true);
    setUpdateStatus({ message: 'Updating...', type: 'info' });

    try {
      const hubsResponse = await fetch('/api/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!hubsResponse.ok) {
        throw new Error('Failed to fetch hubs');
      }
      const hubsData = await hubsResponse.json();
      const hub = hubsData.find((h: any) => h.name === selectedHub);
      
      if (!hub) {
        throw new Error('Hub not found');
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          hubId: hub._id,
          date,
          reason,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action}`);
      }

      const isNowOff = action === 'markDayOff';
      setDaysOff(prev => ({
        ...prev,
        [selectedHub]: {
          ...prev[selectedHub],
          [date]: {
            isOff: isNowOff,
            reason: isNowOff ? reason : '',
          }
        }
      }));

      setUpdateStatus({
        message: isNowOff ? 'Day marked as off!' : 'Day marked as open!',
        type: 'success'
      });
    } catch (error: any) {
      logger.error('Error updating day off:', error);
      setUpdateStatus({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const toggleDayOff = async (date: string) => {
    if (!selectedHub || selectedHub === 'all') return;

    const isCurrentlyOff = daysOff[selectedHub]?.[date]?.isOff || false;
    if (isCurrentlyOff) {
      await updateDay(date, 'markDayOpen');
      return;
    }

    openReasonDialog(date);
  };

  const saveDayOffReason = async () => {
    if (!reasonDialog) return;
    if (reasonCategory === 'Other' && !reasonDetails.trim()) {
      setUpdateStatus({
        message: 'Please add a short description for this closed day.',
        type: 'error',
      });
      setTimeout(() => setUpdateStatus(null), 3000);
      return;
    }

    const reason = buildDayOffReason(reasonCategory, reasonDetails);
    setReasonDialog(null);
    await updateDay(reasonDialog.date, 'markDayOff', reason);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekDates = () => {
    const weekStart = startOfWeek(currentWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(weekStart, i));
    }
    return dates;
  };

  if (!token || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Hub filter is managed by HubFilterContext, no need to check loading state

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Calendar className="h-6 w-6 mr-2 text-primary" />
                Schedule Management
              </CardTitle>
              <CardDescription className="mt-2">
                Manage day-off schedules and availability for learning centers
              </CardDescription>
            </div>
            <Button
              onClick={loadDayOffStatus}
              disabled={loading || !selectedHub || selectedHub === 'all'}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Status Message */}
      {updateStatus && (
        <Alert variant={updateStatus.type === 'error' ? 'destructive' : updateStatus.type === 'success' ? 'default' : 'default'} className={
          updateStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
          updateStatus.type === 'error' ? '' : 'bg-blue-50 border-blue-200 text-blue-800'
        }>
          <AlertTitle>
            {updateStatus.type === 'success' ? 'Success' : updateStatus.type === 'error' ? 'Error' : 'Info'}
          </AlertTitle>
          <AlertDescription>{updateStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* Hub Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-primary" />
            Select Learning Center
          </CardTitle>
          <CardDescription>Choose a hub to manage its schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="hub-select">Learning Center</Label>
            <div className="w-full max-w-md px-3 py-2 border border-input rounded-md bg-muted text-foreground">
              {selectedHub === 'all' ? 'All Hubs (select from top filter)' : selectedHub}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Calendar */}
      {selectedHub && selectedHub !== 'all' && (
        <Card>
          <CardHeader>
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => navigateWeek('prev')}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              
              <CardTitle className="text-lg">
                Week of {format(weekDates[0], 'MMM dd')} - {format(weekDates[6], 'MMM dd, yyyy')}
              </CardTitle>
              
              <Button
                onClick={() => navigateWeek('next')}
                variant="outline"
                size="sm"
              >
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>

            {/* Days Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {weekDates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayInfo = daysOff[selectedHub]?.[dateStr];
                const isOff = dayInfo?.isOff || false;
                const reason = dayInfo?.reason;
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <Card
                    key={dateStr}
                    className={`transition-all ${
                      isOff 
                        ? 'bg-red-50/50 border-red-200' 
                        : 'bg-green-50/50 border-green-200'
                    } ${isToday ? 'ring-2 ring-primary-400 border-primary-300' : ''}`}
                  >
                    <CardContent className="pt-6">
                      {/* Date Header */}
                      <div className="text-center mb-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          {format(date, 'EEE')}
                        </div>
                        <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary-600' : ''}`}>
                          {format(date, 'd')}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="text-center mb-3">
                        <Badge 
                          variant={isOff ? 'destructive' : 'default'}
                          className="flex items-center justify-center gap-1 w-full"
                        >
                          {isOff ? (
                            <>
                              <X className="h-3 w-3" />
                              Day Off
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              Open
                            </>
                          )}
                        </Badge>
                      </div>

                      {isOff && reason && (
                        <p className="mb-3 text-center text-xs leading-snug text-red-700" title={reason}>
                          {reason}
                        </p>
                      )}

                      {/* Toggle Button */}
                      <div className="space-y-2 text-center">
                        <Button
                          onClick={() => toggleDayOff(dateStr)}
                          disabled={loading}
                          variant={isOff ? 'default' : 'destructive'}
                          size="sm"
                          className="w-full"
                        >
                          {isOff ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-1" />
                              Mark Open
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-1" />
                              Mark Off
                            </>
                          )}
                        </Button>
                        {isOff && (
                          <Button
                            onClick={() => openReasonDialog(dateStr, reason)}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit reason
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded mr-2"></div>
                  <span className="text-muted-foreground">Open for appointments</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded mr-2"></div>
                  <span className="text-muted-foreground">Day off (no appointments)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 ring-2 ring-primary-400 rounded mr-2"></div>
                  <span className="text-muted-foreground">Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(!selectedHub || selectedHub === 'all') && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-lg mb-2">Select a Learning Center</CardTitle>
            <CardDescription>Choose a specific hub from the top filter to manage its schedule and closed-day reasons.</CardDescription>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!reasonDialog} onOpenChange={(open) => { if (!open) setReasonDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonDialog?.existingReason ? 'Update closed-day reason' : 'Mark this day off'}
            </DialogTitle>
            <DialogDescription>
              Students will see this reason instead of a missing day. Use a short note like a holiday or staff training.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="day-off-category">Reason</Label>
              <select
                id="day-off-category"
                value={reasonCategory}
                onChange={(event) => setReasonCategory(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DAY_OFF_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="day-off-details">
                {reasonCategory === 'Other' ? 'Description (required)' : 'Details (optional)'}
              </Label>
              <Textarea
                id="day-off-details"
                value={reasonDetails}
                onChange={(event) => setReasonDetails(event.target.value)}
                maxLength={200}
                placeholder={
                  reasonCategory === 'Holiday'
                    ? 'e.g. Labor Day'
                    : reasonCategory === 'Other'
                    ? 'Why is this day closed?'
                    : 'Add a short note students will see'
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialog(null)}>
              Cancel
            </Button>
            <Button onClick={saveDayOffReason} disabled={loading}>
              Save closed day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 