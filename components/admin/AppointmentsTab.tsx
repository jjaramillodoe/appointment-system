"use client";

import { useState } from 'react';
import { Calendar, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, Users, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useHubs } from '@/hooks/useHubs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AppointmentsTabProps {
  appointments: any[];
  stats: any;
  pagination: any;
  filters: any;
  setFilters: (filters: any) => void;
  selectedAppointments: string[];
  setSelectedAppointments: (appointments: string[]) => void;
  onRefresh: () => void;
  token: string;
}

export default function AppointmentsTab({ 
  appointments, 
  stats, 
  pagination, 
  filters, 
  setFilters, 
  selectedAppointments, 
  setSelectedAppointments, 
  onRefresh, 
  token
}: AppointmentsTabProps) {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleFilterChange = (key: string, value: string) => {
    // Hub filter is managed by HubFilterContext, so ignore hubName changes
    if (key === 'hubName') {
      return; // Hub filter is managed globally
    }
    // Convert "all" to empty string for API compatibility
    const filterValue = value === 'all' ? '' : value;
    setFilters({ ...filters, [key]: filterValue, page: 1 });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(appointments.map(a => a._id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments([...selectedAppointments, appointmentId]);
    } else {
      setSelectedAppointments(selectedAppointments.filter(id => id !== appointmentId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAppointments.length === 0) return;

    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentIds: selectedAppointments,
          status: bulkAction,
          adminNotes: bulkNotes
        })
      });

      if (response.ok) {
        setShowBulkModal(false);
        setBulkAction('');
        setBulkNotes('');
        setSelectedAppointments([]);
        onRefresh();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAppointments = async () => {
    if (selectedAppointments.length === 0) return;

    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentIds: selectedAppointments
        })
      });

      if (response.ok) {
        setSelectedAppointments([]);
        setShowDeleteDialog(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting appointments:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Ensure appointments is always an array
  const safeAppointments = appointments || [];

  return (
    <div className="space-y-6">
      {/* Appointment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{stats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">
                  {stats?.find((s: any) => s._id === 'confirmed')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {stats?.find((s: any) => s._id === 'pending')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">
                  {stats?.find((s: any) => s._id === 'cancelled')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
          <CardDescription>Filter appointments by search term, hub, status, or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Notes, hub name..."
                  value={filters?.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Hub filter removed - now handled by HubFilterBar at top */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters?.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status" className="mt-2">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters?.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters?.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Button
              onClick={onRefresh}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <p className="text-sm text-muted-foreground">
              Showing {(((pagination?.page || 1) - 1) * (pagination?.limit || 20)) + 1} to {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)} of {pagination?.total || 0} appointments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAppointments.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 flex-wrap">
                <Badge variant="default" className="text-sm">
                  {selectedAppointments.length} appointment(s) selected
                </Badge>
                <Button
                  onClick={() => setShowBulkModal(true)}
                  size="sm"
                >
                  Bulk Actions
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
              <Button
                onClick={() => setSelectedAppointments([])}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Table */}
      <Card>
        {safeAppointments.length === 0 ? (
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No appointments found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary-600 to-primary-500 hover:bg-gradient-to-r hover:from-primary-600 hover:to-primary-500">
                  <TableHead className="text-white w-12">
                    <Checkbox
                      checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold">Student</TableHead>
                  <TableHead className="text-white font-bold">Appointment</TableHead>
                  <TableHead className="text-white font-bold">Hub</TableHead>
                  <TableHead className="text-white font-bold">Status</TableHead>
                  <TableHead className="text-white font-bold">Notes</TableHead>
                  <TableHead className="text-white font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeAppointments.map((appointment) => (
                  <TableRow key={appointment._id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedAppointments.includes(appointment._id)}
                        onCheckedChange={(checked) => handleSelectAppointment(appointment._id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {appointment.userId?.firstName?.[0]}{appointment.userId?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {appointment.userId?.firstName} {appointment.userId?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{appointment.userId?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {appointment.date ? new Date(appointment.date + 'T00:00:00').toLocaleDateString() : 'No date'}
                      </div>
                      <div className="text-sm text-muted-foreground">{appointment.time || 'No time'}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {appointment.hubId?.name || 'Unknown Hub'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          appointment.status === 'confirmed' ? 'default' :
                          appointment.status === 'pending' ? 'secondary' :
                          appointment.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {appointment.notes || 'No notes'}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailModal(true);
                        }}
                        variant="ghost"
                        size="icon"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <CardContent className="border-t">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-muted-foreground">
                Showing page <span className="font-medium text-foreground">{pagination?.page || 1}</span> of{' '}
                <span className="font-medium text-foreground">{pagination?.pages || 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                  disabled={(pagination?.page || 1) === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination?.pages || 1) }, (_, i) => {
                    const page = Math.max(1, (pagination?.page || 1) - 2) + i;
                    if (page > (pagination?.pages || 1)) return null;
                    return (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        variant={page === (pagination?.page || 1) ? 'default' : 'outline'}
                        size="sm"
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                  disabled={(pagination?.page || 1) === (pagination?.pages || 1)}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Apply an action to {selectedAppointments.length} selected appointment(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulk-action">Action</Label>
              <Select
                value={bulkAction}
                onValueChange={setBulkAction}
              >
                <SelectTrigger id="bulk-action" className="mt-2">
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirm</SelectItem>
                  <SelectItem value="cancelled">Cancel</SelectItem>
                  <SelectItem value="completed">Mark Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-notes">Admin Notes</Label>
              <Textarea
                id="bulk-notes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAction}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        {selectedAppointment && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                View detailed information about this appointment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">
                        {selectedAppointment.userId?.firstName} {selectedAppointment.userId?.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedAppointment.userId?.email}</p>
                    </div>
                    {selectedAppointment.userId?.phone && (
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="text-sm">{selectedAppointment.userId?.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Appointment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Date & Time</Label>
                      <p className="font-medium">
                        {selectedAppointment.date ? new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString() : 'No date'} at {selectedAppointment.time || 'No time'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hub</Label>
                      <p className="text-sm">{selectedAppointment.hubId?.name || 'Unknown Hub'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            selectedAppointment.status === 'confirmed' ? 'default' :
                            selectedAppointment.status === 'pending' ? 'secondary' :
                            selectedAppointment.status === 'cancelled' ? 'destructive' :
                            'outline'
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(selectedAppointment.status)}
                          <span className="capitalize">{selectedAppointment.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedAppointment.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedAppointment.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedAppointment.adminNotes}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="text-sm">{new Date(selectedAppointment.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAppointments.length} appointment(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointments}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 