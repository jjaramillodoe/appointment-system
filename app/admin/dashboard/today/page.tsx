'use client';

import FrontDeskToday from '@/components/admin/FrontDeskToday';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';

export default function TodayPage() {
  const { token, isAdmin } = useAuth();
  const { selectedHub } = useHubFilter();

  if (!token || !isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <FrontDeskToday token={token} hubName={selectedHub && selectedHub !== 'all' ? selectedHub : undefined} />;
}
