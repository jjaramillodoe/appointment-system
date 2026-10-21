"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import UsersTab from '@/components/admin/UsersTab';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';

export default function UsersPage() {
  const { token, isSuperAdmin, assignedHub, user } = useAuth();
  const { selectedHub } = useHubFilter();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userPagination, setUserPagination] = useState({ page: 1, total: 0, pages: 0, limit: 20 });
  const [userFilters, setUserFilters] = useState({
    search: '',
    hubName: '',
    educationLevel: '',
    programInterest: '',
    role: '',
  });

  useEffect(() => {
    setUserFilters((prev) => ({
      ...prev,
      hubName: selectedHub === 'all' || !selectedHub ? '' : selectedHub,
    }));
  }, [selectedHub]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userPagination.page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(userFilters).filter(([, value]) => Boolean(value))
        ),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
      setUserStats(data.stats);
      setUserPagination((prev) => ({
        ...prev,
        ...(data.pagination || {}),
      }));
    } catch (error) {
      logger.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token, userPagination.page, userFilters]);

  const handlePageChange = (page: number) => {
    setUserPagination((prev) => ({ ...prev, page }));
  };

  return (
    <UsersTab
      users={users}
      stats={userStats}
      pagination={userPagination}
      filters={userFilters}
      setFilters={(next) => {
        setUserFilters(next);
        setUserPagination((prev) => ({ ...prev, page: 1 }));
      }}
      onRefresh={loadUsers}
      onPageChange={handlePageChange}
      isSuperAdmin={isSuperAdmin}
      assignedHubId={assignedHub}
      currentUserId={user?._id || null}
    />
  );
}
