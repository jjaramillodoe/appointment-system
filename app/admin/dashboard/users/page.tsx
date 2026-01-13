"use client";

import { useState, useEffect } from 'react';
import UsersTab from '@/components/admin/UsersTab';

export default function UsersPage() {
  const [token, setToken] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userPagination, setUserPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [userFilters, setUserFilters] = useState({ search: '', hubName: '', educationLevel: '', programInterest: '' });

  useEffect(() => {
    const tokenStr = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (tokenStr) {
      setToken(tokenStr);
    }
  }, []);

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