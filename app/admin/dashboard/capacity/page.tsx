"use client";

import { useState } from 'react';
import CapacityTab from '@/components/admin/CapacityTab';
import { useAuth } from '@/contexts/AuthContext';

export default function CapacityPage() {
  const { token, isAdmin } = useAuth();
  const [slotCapacities, setSlotCapacities] = useState<{ [hubName: string]: { [date: string]: any } }>({});
  const [capacityModal, setCapacityModal] = useState<{ hubName: string; date: string; time?: string; open: boolean } | null>(null);
  const [editCapacities, setEditCapacities] = useState<{ [time: string]: { capacity: number; isActive: boolean } }>({});

  const loadSlotCapacities = async (hubName: string, date: string) => {
    try {
      // Get hub ID first
      const hubsResponse = await fetch('/api/admin/hubs');
      const hubs = await hubsResponse.json();
      const hub = hubs.find((h: any) => h.name === hubName);
      
      if (!hub) return;
      
      const response = await fetch(`/api/availability?hubId=${hub._id}&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        const capacityData: { [time: string]: { capacity: number; bookedCount: number; isActive: boolean } } = {};
        
        if (data.success && data.data && data.data.slots) {
          data.data.slots.forEach((slot: any) => {
            capacityData[slot.time] = {
              capacity: slot.capacity,
              bookedCount: slot.booked,
              isActive: slot.available > 0
            };
          });
        }
        
        setSlotCapacities(prev => ({
          ...prev,
          [hubName]: {
            ...prev[hubName],
            [date]: capacityData
          }
        }));
      }
    } catch (error) {
      console.error('Error loading slot capacities:', error);
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

  return (
    <CapacityTab 
      slotCapacities={slotCapacities} 
      capacityModal={capacityModal} 
      setCapacityModal={setCapacityModal} 
      editCapacities={editCapacities} 
      setEditCapacities={setEditCapacities} 
      loadSlotCapacities={loadSlotCapacities}
    />
  );
} 