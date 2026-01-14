"use client";

import { useState, useEffect } from 'react';
import UsersTab from '@/components/admin/UsersTab';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';

export default function UsersPage() {
  const { token } = useAuth();
  const { selectedHub } = useHubFilter();
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userPagination, setUserPagination] = useState({ page: 1, total: 0, pages: 0 });
  
  // Initialize filters
  const [userFilters, setUserFilters] = useState({ search: '', hubName: '', educationLevel: '', programInterest: '' });

  // Sync hub filter from context to local filters
  useEffect(() => {
    setUserFilters(prev => ({
      ...prev,
      hubName: selectedHub === 'all' || !selectedHub ? '' : selectedHub
    }));
  }, [selectedHub]);

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token, userPagination.page, userFilters]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userPagination.page.toString(),
        limit: '20',
        ...userFilters
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users);
      setUserStats(data.stats);
      setUserPagination(data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setUserPagination({ ...userPagination, page });
  };

  return (
    <UsersTab 
      users={users} 
      stats={userStats} 
      pagination={userPagination} 
      filters={userFilters} 
      setFilters={setUserFilters} 
      onRefresh={loadUsers}
      onPageChange={handlePageChange}
    />
  );
} 