"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface HubFilterContextType {
  selectedHub: string | null;
  setSelectedHub: (hub: string | null) => void;
  hubName: string | null;
  isLocked: boolean; // True for hub admins (can't change)
}

const HubFilterContext = createContext<HubFilterContextType | undefined>(undefined);

export function HubFilterProvider({ children }: { children: ReactNode }) {
  const { token, isSuperAdmin, assignedHub } = useAuth();
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [hubName, setHubName] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Fetch hub name for hub admins and set the filter
  useEffect(() => {
    const fetchHubName = async () => {
      if (assignedHub && token && !isSuperAdmin) {
        try {
          const response = await fetch('/api/admin/hubs', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const hubs = await response.json();
            const hub = hubs.find((h: any) => {
              const hubId = h._id?.toString() || h._id;
              const assignedId = assignedHub.toString();
              return hubId === assignedId;
            });
            if (hub) {
              setHubName(hub.name);
              setSelectedHub(hub.name);
              setIsLocked(true); // Lock for hub admins
            }
          }
        } catch (error) {
          console.error('Error fetching hub name:', error);
        }
      } else if (isSuperAdmin) {
        // Super admins can select any hub
        setIsLocked(false);
        // Default to "all" for super admins
        setSelectedHub('all');
      }
    };

    fetchHubName();
  }, [assignedHub, token, isSuperAdmin]);

  // Prevent hub admins from changing the filter
  const handleSetSelectedHub = (hub: string | null) => {
    if (isLocked) {
      return; // Don't allow hub admins to change
    }
    setSelectedHub(hub);
  };

  return (
    <HubFilterContext.Provider
      value={{
        selectedHub,
        setSelectedHub: handleSetSelectedHub,
        hubName,
        isLocked,
      }}
    >
      {children}
    </HubFilterContext.Provider>
  );
}

export function useHubFilter() {
  const context = useContext(HubFilterContext);
  if (context === undefined) {
    throw new Error('useHubFilter must be used within a HubFilterProvider');
  }
  return context;
}
