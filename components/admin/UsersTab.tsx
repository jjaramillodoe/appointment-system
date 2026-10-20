"use client";

import { useEffect, useState } from 'react';
import { Users, Search, Filter, Eye, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, Edit, Trash2, Key, Plus } from 'lucide-react';
import AdminBookModal from '@/components/admin/AdminBookModal';
import { useHubFilter } from '@/contexts/HubFilterContext';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoleFromFlags, ROLE_LABELS, type AppRole } from '@/lib/userRoles';

interface HubOption {
  _id: string;
  name: string;
  location?: string;
}

interface UsersTabProps {
  users: any[];
  stats: any;
  pagination: any;
  filters: any;
  setFilters: (filters: any) => void;
  onRefresh: () => void;
  onPageChange?: (page: number) => void;
  isSuperAdmin?: boolean;
  assignedHubId?: string | null;
  currentUserId?: string | null;
}

const EMPTY_CREATE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  preferredLanguage: 'English',
  role: 'user' as AppRole,
  assignedHub: '',
  closestHubId: '',
};

function roleBadgeClass(role: AppRole) {
  if (role === 'super-admin') return 'bg-purple-100 text-purple-800';
  if (role === 'hub-admin') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

export default function UsersTab({
  users,
  stats,
  pagination,
  filters,
  setFilters,
  onRefresh,
  onPageChange,
  isSuperAdmin = false,
  assignedHubId = null,
  currentUserId = null,
}: UsersTabProps) {
  const { selectedHub } = useHubFilter();
  const { toasts, showSuccess, showError } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [resettingUser, setResettingUser] = useState<any>(null);
  const [bookingUser, setBookingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/hubs?activeOnly=true', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setHubs(data);
      })
      .catch(() => {
        setHubs([]);
      });
  }, []);

  const getUserRole = (user: any): AppRole => user.role || getRoleFromFlags(user);

  const canEditUser = (user: any) => {
    const role = getUserRole(user);
    if (isSuperAdmin) return true;
    return role !== 'super-admin';
  };

  const canDeleteUser = (user: any) => {
    if (user._id === currentUserId) return false;
    return isSuperAdmin || getUserRole(user) === 'user';
  };

  const canResetPassword = (user: any) => {
    if (isSuperAdmin) return true;
    return getUserRole(user) === 'user';
  };

  const assignableRoles: AppRole[] = isSuperAdmin
    ? ['user', 'hub-admin', 'super-admin']
    : ['user', 'hub-admin'];

  const actorHubName = hubs.find((hub) => hub._id === assignedHubId)?.name;

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEdit = (user: any) => {
    const assignedHub =
      typeof user.assignedHub === 'object' && user.assignedHub?._id
        ? user.assignedHub._id
        : user.assignedHub || '';
    const closestHubId =
      hubs.find((hub) => hub.name === user.closestHub?.name)?._id || assignedHub || '';
    setEditingUser({
      ...user,
      role: getUserRole(user),
      assignedHub,
      closestHubId,
    });
    setShowEditModal(true);
  };

  const handleCreateUser = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.phone || !createForm.password) {
      showError('First name, last name, email, phone, and password are required');
      return;
    }
    if (createForm.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    const selectedHubId = createForm.assignedHub || createForm.closestHubId || assignedHubId;
    if (createForm.role !== 'super-admin' && !selectedHubId) {
      showError('Select the hub this person can view');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          phone: createForm.phone,
          password: createForm.password,
          preferredLanguage: createForm.preferredLanguage,
          role: createForm.role,
          assignedHub: createForm.role === 'hub-admin' ? selectedHubId : undefined,
          closestHubId: createForm.role === 'super-admin' ? undefined : selectedHubId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess('User created successfully');
        setShowCreateModal(false);
        setCreateForm(EMPTY_CREATE_FORM);
        onRefresh();
      } else {
        showError(data.error || 'Failed to create user');
      }
    } catch (error) {
      showError('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user: any) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleResetPassword = (user: any) => {
    setResettingUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingUser._id,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          phone: editingUser.phone,
          educationLevel: editingUser.educationLevel,
          employmentStatus: editingUser.employmentStatus,
          preferredLanguage: editingUser.preferredLanguage,
          role: editingUser.role,
          assignedHub: editingUser.role === 'hub-admin' ? editingUser.assignedHub || editingUser.closestHubId : undefined,
          closestHubId: editingUser.role === 'super-admin' ? undefined : (editingUser.closestHubId || editingUser.assignedHub),
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        onRefresh();
      } else {
        showError(data.error || 'Failed to update user');
      }
    } catch (error) {
      showError('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?userId=${deletingUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess(`User deleted successfully${data.deletedAppointments > 0 ? ` (${data.deletedAppointments} appointments removed)` : ''}`);
        setShowDeleteModal(false);
        setDeletingUser(null);
        onRefresh();
      } else {
        showError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      showError('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resettingUser || !newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: resettingUser._id,
          newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Password reset successfully');
        setShowResetPasswordModal(false);
        setResettingUser(null);
        setNewPassword('');
      } else {
        showError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      showError('Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Hub filter is managed by HubFilterContext, so ignore hubName changes
    if (key === 'hubName') {
      return; // Hub filter is managed globally
    }
    setFilters({ ...filters, [key]: value });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Ensure users is always an array
  const safeUsers = users || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? 'Create, update, and manage users and roles across all hubs.'
              : 'Manage users assigned to your hub. You cannot grant super-admin access.'}
          </p>
        </div>
        <Button onClick={() => {
          setCreateForm({
            ...EMPTY_CREATE_FORM,
            assignedHub: assignedHubId || '',
            closestHubId: assignedHubId || '',
          });
          setShowCreateModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Age</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats?.avgAge || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{safeUsers.filter(u => u.employmentStatus === 'Student').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Search & Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={filters?.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hub</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {selectedHub === 'all' || !selectedHub ? 'All Hubs (select from top filter)' : selectedHub}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
            <select
              value={filters?.educationLevel || ''}
              onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="High School">High School</option>
              <option value="Some College">Some College</option>
              <option value="Associate Degree">Associate Degree</option>
              <option value="Bachelor Degree">Bachelor Degree</option>
              <option value="Graduate Degree">Graduate Degree</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters?.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="hub-admin">Hub Admin</option>
              {isSuperAdmin && <option value="super-admin">Super Admin</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Interest</label>
            <select
              value={filters?.programInterest || ''}
              onChange={(e) => handleFilterChange('programInterest', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              <option value="Adult Basic Education">Adult Basic Education</option>
              <option value="ESL">ESL</option>
              <option value="CTE">CTE</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <p className="text-sm text-gray-600">
            Showing {(((pagination?.page || 1) - 1) * (pagination?.limit || 20)) + 1} to {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)} of {pagination?.total || 0} users
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {safeUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Education
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Programs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.dateOfBirth ? `Age: ${calculateAge(user.dateOfBirth)}` : 'Age unavailable'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleBadgeClass(getUserRole(user))}`}>
                      {ROLE_LABELS[getUserRole(user)]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <div>
                        <div className="text-sm text-gray-900">{user.closestHub?.name}</div>
                        <div className="text-xs text-gray-500">{user.closestHub?.distanceText}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{user.educationLevel}</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.employmentStatus}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.programInterests?.map((program: string) => (
                        <span
                          key={program}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {program}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUserClick(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEditUser(user) && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {getUserRole(user) === 'user' && (
                        <button
                          onClick={() => setBookingUser(user)}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                          title="Book appointment"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}
                      {canResetPassword(user) && (
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-orange-600 hover:text-orange-900 flex items-center"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) === (pagination?.pages || 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination?.page || 1}</span> of{' '}
                  <span className="font-medium">{pagination?.pages || 1}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                    disabled={(pagination?.page || 1) === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination?.pages || 1) }, (_, i) => {
                    const page = Math.max(1, (pagination?.page || 1) - 2) + i;
                    if (page > (pagination?.pages || 1)) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === (pagination?.page || 1)
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                    disabled={(pagination?.page || 1) === (pagination?.pages || 1)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.firstName} {selectedUser.middleName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.dateOfBirth ? `${calculateAge(selectedUser.dateOfBirth)} years old` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleBadgeClass(getUserRole(selectedUser))}`}>
                        {ROLE_LABELS[getUserRole(selectedUser)]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {selectedUser.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Education Level</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      {selectedUser.educationLevel}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employment Status</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {selectedUser.employmentStatus}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.address?.street
                      ? `${selectedUser.address.street}, ${selectedUser.address.city}, ${selectedUser.address.state} ${selectedUser.address.zipCode}`
                      : 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Closest Hub</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedUser.closestHub?.name} ({selectedUser.closestHub?.distanceText})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Interests</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedUser.programInterests?.map((program: string) => (
                      <span
                        key={program}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Barriers to Learning</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedUser.barriersToLearning?.map((barrier: string) => (
                      <span
                        key={barrier}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                      >
                        {barrier}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.emergencyContact?.name} ({selectedUser.emergencyContact?.relationship}) - {selectedUser.emergencyContact?.phone}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <Input
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <Input
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Education Level</label>
                  <Select
                    value={editingUser.educationLevel || undefined}
                    onValueChange={(value) => setEditingUser({ ...editingUser, educationLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-hs">No high school</SelectItem>
                      <SelectItem value="some-hs">Some high school</SelectItem>
                      <SelectItem value="ged">GED</SelectItem>
                      <SelectItem value="hs-diploma">High school diploma</SelectItem>
                      <SelectItem value="some-college">Some college</SelectItem>
                      <SelectItem value="college-degree">College degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Status</label>
                  <Select
                    value={editingUser.employmentStatus || undefined}
                    onValueChange={(value) => setEditingUser({ ...editingUser, employmentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Language</label>
                <Select
                  value={editingUser.preferredLanguage || 'English'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, preferredLanguage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={editingUser.role || 'user'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-xs text-gray-500 mt-1">Hub admins cannot assign Super Admin.</p>
                )}
              </div>
              {editingUser.role === 'super-admin' ? (
                <p className="text-sm text-gray-600">Super admins can view every hub.</p>
              ) : isSuperAdmin ? (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {editingUser.role === 'hub-admin' ? 'Hub they administer' : 'Home hub'}
                  </label>
                  <Select
                    value={editingUser.closestHubId || editingUser.assignedHub || undefined}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        closestHubId: value,
                        assignedHub: editingUser.role === 'hub-admin' ? value : editingUser.assignedHub,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map((hub) => (
                        <SelectItem key={hub._id} value={hub._id}>
                          {hub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This is the site they belong to and the one hub admins can view.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Hub</label>
                  <Input value={actorHubName || editingUser.closestHub?.name || 'Your assigned hub'} disabled />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.firstName} {deletingUser?.lastName}?
              This action cannot be undone and will also delete all associated appointments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resettingUser?.firstName} {resettingUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmResetPassword} disabled={loading || newPassword.length < 6}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new account and assign a role. Hub admins stay limited to their own site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temporary Password</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Language</label>
                <Select
                  value={createForm.preferredLanguage}
                  onValueChange={(value) => setCreateForm({ ...createForm, preferredLanguage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createForm.role === 'super-admin' ? (
              <p className="text-sm text-gray-600">Super admins can view every hub. No hub assignment is needed.</p>
            ) : isSuperAdmin ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {createForm.role === 'hub-admin' ? 'Hub they administer' : 'Home hub'}
                </label>
                <Select
                  value={(createForm.assignedHub || createForm.closestHubId) || undefined}
                  onValueChange={(value) =>
                    setCreateForm({
                      ...createForm,
                      assignedHub: value,
                      closestHubId: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((hub) => (
                      <SelectItem key={hub._id} value={hub._id}>
                        {hub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Required. This is the site they will view and the hub admins will manage them under.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Hub</label>
                <Input value={actorHubName || 'Your assigned hub'} disabled />
                <p className="text-xs text-gray-500 mt-1">
                  New accounts stay on your assigned hub.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {bookingUser && (
        <AdminBookModal
          open={Boolean(bookingUser)}
          onClose={() => setBookingUser(null)}
          token={localStorage.getItem('token') || ''}
          userId={bookingUser._id}
          studentName={`${bookingUser.firstName || ''} ${bookingUser.lastName || ''}`.trim()}
          defaultHubId={assignedHubId || undefined}
          onBooked={() => {
            showSuccess('Appointment booked');
            onRefresh();
          }}
        />
      )}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
} 