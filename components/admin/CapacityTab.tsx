"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, Users, Settings, RefreshCw, AlertCircle, Building2, Calendar, Clock } from 'lucide-react';
import { useHubs } from '../../hooks/useHubs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CapacityTabProps {
  slotCapacities: { [hubName: string]: { [date: string]: any } };
  capacityModal: { hubName: string; date: string; time?: string; open: boolean } | null;
  setCapacityModal: (modal: { hubName: string; date: string; time?: string; open: boolean } | null) => void;
  editCapacities: { [time: string]: { capacity: number; isActive: boolean } };
  setEditCapacities: (capacities: { [time: string]: { capacity: number; isActive: boolean } }) => void;
  loadSlotCapacities: (hubName: string, date: string) => Promise<void>;
}

export default function CapacityTab({
  slotCapacities,
  capacityModal,
  setCapacityModal,
  editCapacities,
  setEditCapacities,
  loadSlotCapacities
}: CapacityTabProps) {
  const { hubs, loading: hubsLoading } = useHubs();
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [optimizedData, setOptimizedData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Set default hub when hubs are loaded
  useEffect(() => {
    if (hubs.length > 0 && !selectedHub) {
      setSelectedHub(hubs[0]);
    }
  }, [hubs, selectedHub]);

  // Set default date to today
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [selectedDate]);

  // Load optimized availability data
  useEffect(() => {
    if (selectedHub && selectedDate) {
      loadOptimizedAvailability();
    }
  }, [selectedHub, selectedDate]);

  const loadOptimizedAvailability = async () => {
    if (!selectedHub || !selectedDate) return;
    
    setLoading(true);
    try {
      // Find hub ID
      const hubData = await fetch('/api/admin/hubs').then(res => res.json());
      const hub = hubData.find((h: any) => h.name === selectedHub);
      
      if (!hub) {
        console.error('Hub not found:', selectedHub);
        return;
      }

      const response = await fetch(`/api/availability?hubId=${hub._id}&date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOptimizedData(data.data);
          console.log('✅ Loaded optimized availability:', data.data);
        }
      } else {
        console.error('Failed to load optimized availability:', response.status);
      }
    } catch (error) {
      console.error('Error loading optimized availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSlotCapacity = async (time: string, capacity: number, isActive: boolean) => {
    setIsUpdating(true);
    setUpdateStatus({ message: 'Updating capacity...', type: 'info' });
    
    try {
      // Find hub ID
      const hubData = await fetch('/api/admin/hubs').then(res => res.json());
      const hub = hubData.find((h: any) => h.name === selectedHub);
      
      if (!hub) {
        throw new Error('Hub not found');
      }

      // For now, we'll need to implement a specific capacity update endpoint
      // This is a simplified approach - in a full implementation, you'd have a dedicated endpoint
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateCapacity',
          hubId: hub._id,
          date: selectedDate,
          time: time,
          capacity: capacity,
          isActive: isActive
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update capacity');
      }

      setUpdateStatus({ message: 'Capacity updated successfully!', type: 'success' });
      setCapacityModal(null);
      await loadOptimizedAvailability(); // Refresh data
    } catch (error: any) {
      console.error('Error updating capacity:', error);
      setUpdateStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const calculateUtilization = (slot: any) => {
    if (!slot || slot.capacity === 0) return 0;
    return Math.round((slot.booked / slot.capacity) * 100);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 bg-red-100';
    if (utilization >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (hubsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-2 text-primary" />
            Capacity Management
          </CardTitle>
          <CardDescription>View and manage slot capacities for learning centers</CardDescription>
        </CardHeader>
      </Card>

      {/* Status Updates */}
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

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Filter Options
          </CardTitle>
          <CardDescription>Select hub and date to view capacity information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hub-select">Hub</Label>
              <Select
                value={selectedHub || 'all'}
                onValueChange={(value) => setSelectedHub(value === 'all' ? '' : value)}
                disabled={hubsLoading}
              >
                <SelectTrigger id="hub-select" className="mt-2">
                  <SelectValue placeholder="Select a hub..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a hub...</SelectItem>
                  {hubs.map((hub) => (
                    <SelectItem key={hub} value={hub}>{hub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-select">Date</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadOptimizedAvailability}
                disabled={loading || !selectedHub || !selectedDate}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Overview */}
      {optimizedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Capacity Overview - {optimizedData.hubName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
                </CardDescription>
              </div>
            </div>
            {optimizedData.isDayOff && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Day Off</AlertTitle>
                <AlertDescription>This day is marked as off - no appointments available</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            {optimizedData.isDayOff ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="text-lg mb-2">No Slots Available</CardTitle>
                <CardDescription>This day is marked as off and no appointments can be scheduled</CardDescription>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-primary-600 to-primary-500 hover:bg-gradient-to-r hover:from-primary-600 hover:to-primary-500">
                      <TableHead className="text-white font-bold">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Time
                        </div>
                      </TableHead>
                      <TableHead className="text-white font-bold">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Capacity
                        </div>
                      </TableHead>
                      <TableHead className="text-white font-bold">Booked</TableHead>
                      <TableHead className="text-white font-bold">Available</TableHead>
                      <TableHead className="text-white font-bold">Utilization</TableHead>
                      <TableHead className="text-white font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizedData.slots.map((slot: any) => {
                      const utilization = calculateUtilization(slot);
                      return (
                        <TableRow key={slot.time} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              {slot.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              {slot.capacity}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {slot.booked}
                          </TableCell>
                          <TableCell>
                            <Badge variant={slot.available > 0 ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                              {slot.available} available
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                utilization >= 90 ? 'destructive' :
                                utilization >= 70 ? 'secondary' :
                                'default'
                              }
                              className="flex items-center gap-1 w-fit"
                            >
                              {utilization}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => {
                                setCapacityModal({
                                  hubName: selectedHub,
                                  date: selectedDate,
                                  time: slot.time,
                                  open: true
                                });
                                setEditCapacities({
                                  [slot.time]: {
                                    capacity: slot.capacity,
                                    isActive: true
                                  }
                                });
                              }}
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!optimizedData && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="text-lg mb-2">No Data Available</CardTitle>
            <CardDescription>Select a hub and date to view capacity information</CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Edit Capacity Dialog */}
      <Dialog open={capacityModal?.open || false} onOpenChange={(open) => !open && setCapacityModal(null)}>
        {capacityModal && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Edit Capacity - {capacityModal.time}
              </DialogTitle>
              <DialogDescription>
                {capacityModal.hubName} • {format(new Date(capacityModal.date + 'T00:00:00'), 'EEEE, MMMM dd, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="capacity-input">Capacity</Label>
                <Input
                  id="capacity-input"
                  type="number"
                  min="0"
                  max="100"
                  value={capacityModal.time ? editCapacities[capacityModal.time]?.capacity || 20 : 20}
                  onChange={(e) => {
                    if (capacityModal.time) {
                      setEditCapacities({
                        ...editCapacities,
                        [capacityModal.time]: {
                          ...editCapacities[capacityModal.time] || { capacity: 20, isActive: true },
                          capacity: parseInt(e.target.value) || 0
                        }
                      });
                    }
                  }}
                  placeholder="Enter capacity (0-100)"
                />
                <p className="text-xs text-muted-foreground">Maximum number of appointments allowed for this time slot</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={capacityModal.time ? editCapacities[capacityModal.time]?.isActive !== false : true}
                  onCheckedChange={(checked) => {
                    if (capacityModal.time) {
                      setEditCapacities({
                        ...editCapacities,
                        [capacityModal.time]: {
                          ...editCapacities[capacityModal.time] || { capacity: 20, isActive: true },
                          isActive: checked as boolean
                        }
                      });
                    }
                  }}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCapacityModal(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (capacityModal.time) {
                    updateSlotCapacity(
                      capacityModal.time,
                      editCapacities[capacityModal.time]?.capacity || 20,
                      editCapacities[capacityModal.time]?.isActive !== false
                    );
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 