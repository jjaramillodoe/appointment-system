"use client";

import { useHubFilter } from '@/contexts/HubFilterContext';
import { useHubs } from '@/hooks/useHubs';
import { Building2, Lock, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function HubFilterBar() {
  const { selectedHub, setSelectedHub, hubName, isLocked } = useHubFilter();
  const { hubs, loading: hubsLoading } = useHubs();

  if (isLocked && hubName) {
    // Hub admin - show elegant badge display
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
        <Building2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">{hubName}</span>
        <Lock className="h-3 w-3 text-blue-500" />
      </div>
    );
  }

  // Super admin - show elegant dropdown
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-gray-500" />
      <Select
        value={selectedHub || 'all'}
        onValueChange={(value) => setSelectedHub(value === 'all' ? null : value)}
        disabled={hubsLoading}
      >
        <SelectTrigger className="w-[200px] h-9 border-gray-300 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <SelectValue placeholder={hubsLoading ? "Loading..." : "All Hubs"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>All Hubs</span>
            </div>
          </SelectItem>
          {hubs.map((hub) => (
            <SelectItem key={hub} value={hub}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{hub}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
