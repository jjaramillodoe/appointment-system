"use client";

import { useState, useEffect } from 'react';
import AppointmentsTab from '@/components/admin/AppointmentsTab';
import { useAuth } from '@/contexts/AuthContext';

export default function AppointmentsPage() {
  const { token, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [appointmentPagination, setAppointmentPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [appointmentFilters, setAppointmentFilters] = useState({ search: '', hubName: '', status: '', startDate: '', endDate: '' });
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && isAdmin) {
      loadAppointments();
    }
  }, [token, isAdmin, appointmentPagination.page, appointmentFilters]);

  const loadAppointments = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      // Filter out empty values and convert them properly
      const cleanFilters = Object.fromEntries(
        Object.entries(appointmentFilters).filter(([_, v]) => v !== '')
      );
      
      const params = new URLSearchParams({
        page: appointmentPagination.page.toString(),
        limit: '20',
        ...cleanFilters
      });

      const response = await fetch(`/api/admin/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
        setAppointmentStats(data.stats || []);
        setAppointmentPagination(data.pagination || { page: 1, total: 0, pages: 0 });
      } else {
        console.error('Failed to load appointments:', response.status);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <AppointmentsTab 
      appointments={appointments} 
      stats={appointmentStats} 
      pagination={appointmentPagination} 
      filters={appointmentFilters} 
      setFilters={setAppointmentFilters} 
      selectedAppointments={selectedAppointments} 
      setSelectedAppointments={setSelectedAppointments} 
      onRefresh={loadAppointments} 
      token={token} 
    />
  );
} 