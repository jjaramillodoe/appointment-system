import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';

export function useHubs() {
  const [hubs, setHubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch('/api/admin/hubs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch hubs');
        }
        
        const data = await response.json();
        // Extract hub names from the hub objects
        const hubNames = data.map((hub: any) => hub.name);
        setHubs(hubNames);
      } catch (err) {
        logger.error('Error fetching hubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hubs');
        setHubs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHubs();
  }, []);

  return { hubs, loading, error };
} 