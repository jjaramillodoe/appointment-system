"use client";

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Trash2, Edit2, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface BlackoutDate {
  _id: string;
  date: string;
  title: string;
  description?: string;
  type: 'holiday' | 'maintenance' | 'training' | 'emergency' | 'other';
  affectedHubs?: any[];
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
}

interface FormData {
  date: string;
  title: string;
  description: string;
  type: 'holiday' | 'maintenance' | 'training' | 'emergency' | 'other';
  isAllDay: boolean;
  startTime: string;
  endTime: string;
}

const typeColors: Record<string, string> = {
  holiday: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  training: 'bg-blue-100 text-blue-800',
  emergency: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function BlackoutDatesPage() {
  const { token, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    date: '',
    title: '',
    description: '',
    type: 'holiday',
    isAllDay: true,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadBlackoutDates();
  }, [token, isSuperAdmin]);

  const loadBlackoutDates = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 2);

      const response = await fetch(
        `/api/admin/blackout-dates?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setBlackoutDates(data.blackoutDates);
      }
    } catch (err) {
      setError('Failed to load blackout dates');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (blackout?: BlackoutDate) => {
    if (blackout) {
      setEditingId(blackout._id);
      setFormData({
        date: blackout.date.split('T')[0],
        title: blackout.title,
        description: blackout.description || '',
        type: blackout.type,
        isAllDay: blackout.isAllDay,
        startTime: blackout.startTime || '09:00',
        endTime: blackout.endTime || '17:00',
      });
    } else {
      setEditingId(null);
      setFormData({
        date: '',
        title: '',
        description: '',
        type: 'holiday',
        isAllDay: true,
        startTime: '09:00',
        endTime: '17:00',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.date || !formData.title) {
      setError('Date and title are required');
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/admin/blackout-dates/${editingId}`
        : '/api/admin/blackout-dates';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadBlackoutDates();
        handleCloseModal();
        setSuccess(`Blackout date ${editingId ? 'updated' : 'created'} successfully!`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('An error occurred');
      logger.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blackout date?')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/blackout-dates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadBlackoutDates();
        setSuccess('Blackout date deleted');
      } else {
        setError('Failed to delete');
      }
    } catch (err) {
      setError('An error occurred');
      logger.error(err);
    } finally {
      setDeleting(false);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Holiday & Blackout Dates
          </h1>
          <p className="text-gray-600 mt-1">Mark days when appointments cannot be scheduled</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Blackout Date
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Blackout Dates List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : blackoutDates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No blackout dates</h3>
          <p className="text-gray-600 mb-6">Add holidays and maintenance windows to block appointment booking</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add First Blackout Date
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {blackoutDates.map(blackout => (
            <div key={blackout._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{blackout.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[blackout.type]}`}>
                      {blackout.type.charAt(0).toUpperCase() + blackout.type.slice(1)}
                    </span>
                  </div>
                  {blackout.description && (
                    <p className="text-gray-600 text-sm">{blackout.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(blackout)}
                    className="text-blue-600 hover:text-blue-700 p-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(blackout._id)}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-medium text-gray-900">{new Date(blackout.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <p className="font-medium text-gray-900">
                    {blackout.isAllDay ? 'All day' : `${blackout.startTime} - ${blackout.endTime}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Blackout Date' : 'Add Blackout Date'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="holiday">Holiday</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="training">Training</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Independence Day"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional notes about this blackout date"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAllDay"
                    checked={formData.isAllDay}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">All day</span>
                </label>
              </div>

              {!formData.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
