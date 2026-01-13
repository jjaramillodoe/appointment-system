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
        
        const response = await fetch('/api/admin/hubs');
        if (!response.ok) {
          throw new Error('Failed to fetch hubs');
        }
        
        const data = await response.json();
        // Extract hub names from the hub objects
        const hubNames = data.map((hub: any) => hub.name);
        setHubs(hubNames);
      } catch (err) {
        console.error('Error fetching hubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hubs');
        // Fallback to hardcoded hubs if API fails
        setHubs([
          'Bronx Adult Learning Center',
          'Manhattan Hub',
          'Brooklyn Hub',
          'Queens Hub',
          'Staten Island Hub'
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHubs();
  }, []);

  return { hubs, loading, error };
} 