"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Edit2, Trash2, Plus, MapPin, X, AlertCircle } from 'lucide-react';
import MarkdownContent from '@/components/MarkdownContent';

interface Hub {
  _id: string;
  name: string;
  location: string;
  timezone: string;
  defaultSlots: string[];
  publicTransitDirections?: string;
  isActive: boolean;
  schoolId?: { _id: string; name: string } | string | null;
}

interface FormData {
  name: string;
  location: string;
  timezone: string;
  defaultSlots: string;
  publicTransitDirections: string;
  isActive: boolean;
  schoolId: string;
}

export default function HubsManagement() {
  const { token, isSuperAdmin } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [directionsMode, setDirectionsMode] = useState<'write' | 'preview'>('write');
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [schools, setSchools] = useState<Array<{ _id: string; name: string }>>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    timezone: 'America/New_York',
    defaultSlots: '09:00,09:30,10:00,10:30,11:00,11:30',
    publicTransitDirections: '',
    isActive: true,
    schoolId: '',
  });

  useEffect(() => {
    loadHubs();
    loadSchools();
  }, [token]);

  const loadSchools = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/admin/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const loadHubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHubs(data);
      }
    } catch (err) {
      setError('Failed to load hubs');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hub: Hub | null = null) => {
    if (hub) {
      setEditingHub(hub);
      setFormData({
        name: hub.name,
        location: hub.location,
        timezone: hub.timezone,
        defaultSlots: hub.defaultSlots.join(','),
        publicTransitDirections: hub.publicTransitDirections || '',
        isActive: hub.isActive,
        schoolId: typeof hub.schoolId === 'object' && hub.schoolId ? hub.schoolId._id : hub.schoolId || '',
      });
    } else {
      setEditingHub(null);
      setFormData({
        name: '',
        location: '',
        timezone: 'America/New_York',
        defaultSlots: '09:00,09:30,10:00,10:30,11:00,11:30',
        publicTransitDirections: '',
        isActive: true,
        schoolId: '',
      });
    }
    setDirectionsMode('write');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHub(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        timezone: formData.timezone,
        defaultSlots: formData.defaultSlots.split(',').map(s => s.trim()),
        publicTransitDirections: formData.publicTransitDirections,
        isActive: formData.isActive,
        schoolId: formData.schoolId || '',
      };

      if (editingHub) {
        // Update
        const response = await fetch(`/api/admin/hubs/${editingHub._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await loadHubs();
          handleCloseModal();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to update hub');
        }
      } else {
        // Create
        const response = await fetch('/api/admin/hubs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await loadHubs();
          handleCloseModal();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to create hub');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      logger.error(err);
    }
  };

  const handleDelete = async (hubId: string) => {
    if (!window.confirm('Are you sure you want to delete this hub?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hubs/${hubId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadHubs();
      } else {
        setError('Failed to delete hub');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      logger.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isSuperAdmin ? 'Hubs Management' : 'Your Hub'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? 'Create, edit, and manage learning centers'
              : 'View and update the learning center assigned to you'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Hub
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Hubs List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : hubs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No hubs yet</h3>
          <p className="text-gray-600 mb-6">
            {isSuperAdmin ? 'Create your first learning center to get started' : 'No hub is assigned to your account'}
          </p>
          {isSuperAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Hub
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {hubs.map(hub => (
            <div key={hub._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{hub.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{hub.location}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    School: {typeof hub.schoolId === 'object' && hub.schoolId ? hub.schoolId.name : 'Unassigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(hub)}
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(hub._id)}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">TIMEZONE</p>
                  <p className="text-gray-900">{hub.timezone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">STATUS</p>
                  <p className={`${hub.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {hub.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {hub.publicTransitDirections && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-2">PUBLIC TRANSIT DIRECTIONS</p>
                  <MarkdownContent>{hub.publicTransitDirections}</MarkdownContent>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingHub ? 'Edit Hub' : 'Create Hub'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">School</label>
                <select
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {schools.map((school) => (
                    <option key={school._id} value={school._id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Hub Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bronx Learning Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1234 Main St, Bronx, NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>America/New_York</option>
                    <option>America/Chicago</option>
                    <option>America/Denver</option>
                    <option>America/Los_Angeles</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Default Appointment Slots</label>
                <input
                  type="text"
                  name="defaultSlots"
                  value={formData.defaultSlots}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 09:00,09:30,10:00,10:30"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of times in HH:MM format</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">Public Transit Directions</label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setDirectionsMode('write')}
                      className={`px-3 py-1 ${directionsMode === 'write' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectionsMode('preview')}
                      className={`px-3 py-1 ${directionsMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                {directionsMode === 'write' ? (
                  <textarea
                    name="publicTransitDirections"
                    value={formData.publicTransitDirections}
                    onChange={handleInputChange}
                    rows={14}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
                    placeholder={'## Subway\n\n### Q Train\n\n- Take the Q to **Avenue H**\n- Walk west toward Coney Island Avenue\n\n## Bus\n\n- Take the **B68** to Coney Island Ave / Avenue H'}
                  />
                ) : (
                  <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-gray-50 p-4">
                    {formData.publicTransitDirections.trim() ? (
                      <MarkdownContent>{formData.publicTransitDirections}</MarkdownContent>
                    ) : (
                      <p className="text-sm text-gray-500">Nothing to preview yet.</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Markdown supported: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingHub ? 'Update Hub' : 'Create Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
