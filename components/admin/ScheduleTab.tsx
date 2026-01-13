"use client";

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X, Edit, Check, Plus } from 'lucide-react';
import { useHubs } from '../../hooks/useHubs';

interface ScheduleTabProps {
  daysOff: { [hubName: string]: string[] };
  customSlots: { [hubName: string]: { [date: string]: string[] } };
  defaultSlots: { [hubName: string]: string[] };
  editModal: { hubName: string; date: string; open: boolean } | null;
  setEditModal: (modal: { hubName: string; date: string; open: boolean } | null) => void;
  editSlots: string[];
  setEditSlots: (slots: string[]) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  dayFilter: string;
  setDayFilter: (filter: string) => void;
  itemsPerPage?: number;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30'
];

export default function ScheduleTab({
  daysOff,
  customSlots,
  defaultSlots,
  editModal,
  setEditModal,
  editSlots,
  setEditSlots,
  currentPage,
  setCurrentPage,
  dateFilter,
  setDateFilter,
  dayFilter,
  setDayFilter,
  itemsPerPage = 10
}: ScheduleTabProps) {
  const { hubs, loading: hubsLoading } = useHubs();
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');

  // Set default hub when hubs are loaded
  useEffect(() => {
    if (hubs.length > 0 && !selectedHub) {
      setSelectedHub(hubs[0]);
    }
  }, [hubs, selectedHub]);

  const handleMarkDayOff = async (hubName: string, date: string) => {
    setIsUpdating(true);
    setUpdateStatus('Marking day off...');
    
    try {
      // Find hub ID
      const hubData = await fetch('/api/admin/hubs').then(res => res.json());
      const hub = hubData.find((h: any) => h.name === hubName);
      
      if (!hub) {
        throw new Error('Hub not found');
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markDayOff',
          hubId: hub._id,
          date: date
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark day off');
      }

      setUpdateStatus('✅ Day marked off successfully!');
      // Refresh the parent component data
      window.location.reload(); // Simple refresh for now
    } catch (error: any) {
      console.error('Error marking day off:', error);
      setUpdateStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };

  const handleUpdateSlots = async (hubName: string, date: string, slots: string[]) => {
    setIsUpdating(true);
    setUpdateStatus('Updating slots...');
    
    try {
      // Find hub ID
      const hubData = await fetch('/api/admin/hubs').then(res => res.json());
      const hub = hubData.find((h: any) => h.name === hubName);
      
      if (!hub) {
        throw new Error('Hub not found');
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateSlots',
          hubId: hub._id,
          date: date,
          slots: slots
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update slots');
      }

      setUpdateStatus('✅ Slots updated successfully!');
      setEditModal(null);
      // Refresh the parent component data
      window.location.reload(); // Simple refresh for now
    } catch (error: any) {
      console.error('Error updating slots:', error);
      setUpdateStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };

  // Generate dates for the current page
  const startDate = addDays(new Date(), (currentPage - 1) * itemsPerPage);
  const dates = Array.from({ length: itemsPerPage }, (_, i) => addDays(startDate, i));
  
     const getSlotInfo = (hubName: string, date: Date) => {
     const dateStr = format(date, 'yyyy-MM-dd');
    const hubDaysOff = daysOff[hubName] || [];
    const hubCustomSlots = customSlots[hubName] || {};
    const hubDefaultSlots = defaultSlots[hubName] || TIME_SLOTS;
    
    if (hubDaysOff.includes(dateStr)) {
      return { type: 'off', slots: [] };
    }
    
    if (hubCustomSlots[dateStr]) {
      return { type: 'custom', slots: hubCustomSlots[dateStr] };
    }
    
    return { type: 'default', slots: hubDefaultSlots };
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'off': return 'bg-red-100 text-red-800';
      case 'custom': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (hubsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Updates */}
      {updateStatus && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          updateStatus.includes('✅') ? 'bg-green-50 text-green-700' : 
          updateStatus.includes('❌') ? 'bg-red-50 text-red-700' : 
          'bg-blue-50 text-blue-700'
        }`}>
          {updateStatus}
        </div>
      )}

      {/* Hub Filter */}
      <div className="flex items-center space-x-4">
        <label htmlFor="hub-filter" className="text-sm font-medium text-gray-700">
          Filter by Hub:
        </label>
        <select
          id="hub-filter"
          value={selectedHub}
          onChange={(e) => setSelectedHub(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Hubs</option>
          {hubs.map((hub) => (
            <option key={hub} value={hub}>{hub}</option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Schedule Management - Page {currentPage}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            {format(startDate, 'MMM dd')} - {format(addDays(startDate, itemsPerPage - 1), 'MMM dd, yyyy')}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hub
                </th>
                {dates.map((date) => (
                  <th key={date.getTime()} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div>{format(date, 'MMM dd')}</div>
                    <div className="text-xs text-gray-400">{format(date, 'EEE')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(selectedHub ? [selectedHub] : hubs).map((hubName) => (
                <tr key={hubName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {hubName}
                  </td>
                  {dates.map((date) => {
                    const slotInfo = getSlotInfo(hubName, date);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    
                    return (
                      <td key={date.getTime()} className="px-3 py-4 text-center">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(slotInfo.type)}`}>
                            {slotInfo.type === 'off' ? 'Day Off' : 
                             slotInfo.type === 'custom' ? 'Custom' : 'Default'}
                          </span>
                          <div className="text-xs text-gray-600">
                            {slotInfo.slots.length} slots
                          </div>
                          <div className="flex space-x-1 justify-center">
                            {slotInfo.type !== 'off' && (
                              <button
                                onClick={() => {
                                  setEditModal({ hubName, date: dateStr, open: true });
                                  setEditSlots(slotInfo.slots);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit slots"
                                disabled={isUpdating}
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleMarkDayOff(hubName, dateStr)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Mark day off"
                              disabled={isUpdating}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Slots - {editModal.hubName}
              </h3>
                             <p className="text-sm text-gray-600 mt-1">
                 {format(new Date(editModal.date + 'T00:00:00'), 'EEEE, MMMM dd, yyyy')}
               </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Available Time Slots:</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((timeSlot) => (
                    <label key={timeSlot} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editSlots.includes(timeSlot)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSlots([...editSlots, timeSlot]);
                          } else {
                            setEditSlots(editSlots.filter(s => s !== timeSlot));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{timeSlot}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateSlots(editModal.hubName, editModal.date, editSlots)}
                  className="flex-1 px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Slots'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}