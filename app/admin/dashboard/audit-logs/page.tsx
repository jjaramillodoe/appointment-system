"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, AlertCircle, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';

interface AuditLog {
  _id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceName?: string;
  description: string;
  status: string;
  changes?: Array<{ field: string; oldValue: any; newValue: any }>;
  createdAt: string;
  ipAddress?: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  export: 'bg-yellow-100 text-yellow-800',
  send: 'bg-indigo-100 text-indigo-800',
  bulk_action: 'bg-orange-100 text-orange-800',
};

export default function AuditLogsPage() {
  const { token, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [limit, setLimit] = useState(50);

  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    adminEmail: '',
    resourceId: '',
    startDate: '',
    endDate: '',
  });

  const actions = ['create', 'update', 'delete', 'login', 'logout', 'export', 'send', 'bulk_action'];
  const resourceTypes = ['user', 'appointment', 'hub', 'template', 'reminder', 'blackout', 'communication', 'settings', 'schedule', 'school', 'class', 'other'];

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadLogs();
  }, [token, isSuperAdmin, page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.adminEmail) params.append('adminEmail', filters.adminEmail);
      if (filters.resourceId) params.append('resourceId', filters.resourceId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.pagination.total);
        setPages(data.pagination.pages);
      }
    } catch (err) {
      logger.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      adminEmail: '',
      resourceId: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Only super admins can access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          Audit Log
        </h1>
        <p className="text-gray-600 mt-1">Track all admin actions and system changes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={handleResetFilters}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All actions</option>
              {actions.map(a => (
                <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Resource Type</label>
            <select
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All types</option>
              {resourceTypes.map(rt => (
                <option key={rt} value={rt}>{rt.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Admin Email</label>
            <input
              type="email"
              name="adminEmail"
              value={filters.adminEmail}
              onChange={handleFilterChange}
              placeholder="Filter by admin..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Resource ID</label>
            <input
              type="text"
              name="resourceId"
              value={filters.resourceId}
              onChange={handleFilterChange}
              placeholder="Filter by resource..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No audit logs</h3>
          <p className="text-gray-600">No activities match your filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Time</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Admin</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Resource</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <div className="font-medium text-gray-900">{log.adminName}</div>
                        <div className="text-gray-600">{log.adminEmail}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <div className="font-medium text-gray-900">{log.resourceType.toUpperCase()}</div>
                        {log.resourceName && <div className="text-gray-600">{log.resourceName}</div>}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const p = i + Math.max(1, page - 2);
                    if (p > pages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          p === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Admin Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedLog.adminName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedLog.adminEmail}</p>
                  </div>
                  {selectedLog.ipAddress && (
                    <div>
                      <p className="text-sm text-gray-600">IP Address</p>
                      <p className="font-medium text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Action</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${actionColors[selectedLog.action] || 'bg-gray-100 text-gray-800'}`}>
                      {selectedLog.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resource Type</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedLog.resourceType.toUpperCase()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedLog.description}</p>
                  </div>
                </div>
              </div>

              {/* Changes */}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Changes</h3>
                  <div className="space-y-3">
                    {selectedLog.changes.map((change, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900 mb-2">{change.field}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Old Value</p>
                            <p className="font-mono text-xs bg-red-50 text-red-800 p-2 rounded">
                              {JSON.stringify(change.oldValue) || '(empty)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">New Value</p>
                            <p className="font-mono text-xs bg-green-50 text-green-800 p-2 rounded">
                              {JSON.stringify(change.newValue) || '(empty)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-600">
                <p>Logged at: {new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
