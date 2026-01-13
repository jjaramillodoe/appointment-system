'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';

interface ScheduleForm {
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  selectedHub: string;
}

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleForm: ScheduleForm;
  setScheduleForm: (form: ScheduleForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isScheduling: boolean;
  error: string;
  isDayOff: boolean;
  availableSlots: string[];
  user: any;
  hubConfigs: any[];
}

export default function ScheduleAppointmentModal({
  isOpen,
  onClose,
  scheduleForm,
  setScheduleForm,
  onSubmit,
  isScheduling,
  error,
  isDayOff,
  availableSlots,
  user,
  hubConfigs
}: ScheduleAppointmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Appointment</h3>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            This is your recommended learning center based on your address. If you need a different location, please update your address or contact support.
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={scheduleForm.appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                max={addDays(new Date(), 30).toISOString().split('T')[0]}
                onChange={(e) => {
                  // Parse as local date to avoid UTC bug
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const selectedDate = new Date(year, month - 1, day);
                  
                  // Check if this date is marked as off in the hub configuration
                  const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
                  const dateStr = e.target.value;
                  const isOff = selectedHubConfig ? (selectedHubConfig.daysOff || []).includes(dateStr) : false;
                  
                  if (isOff) {
                    // Handle error state
                  } else {
                    setScheduleForm({ ...scheduleForm, appointmentDate: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                value={scheduleForm.appointmentTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isDayOff || availableSlots.length === 0}
              >
                <option value="">Select a time</option>
                {availableSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {isDayOff && (
                <p className="text-red-500 text-xs mt-1">This day is off for this learning center.</p>
              )}
              {availableSlots.length === 0 && !isDayOff && (
                <p className="text-red-500 text-xs mt-1">No available slots for this date. All slots may be at full capacity.</p>
              )}
              {availableSlots.length > 0 && (
                <p className="text-green-600 text-xs mt-1">{availableSlots.length} time slots available</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Learning Center</label>
              <select
                value={scheduleForm.selectedHub}
                onChange={e => setScheduleForm({ ...scheduleForm, selectedHub: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled
              >
                {user?.closestHub ? (
                  <option value={user.closestHub.name}>{user.closestHub.name} - {user.closestHub.address}</option>
                ) : (
                  <option value="">No recommended hub found</option>
                )}
              </select>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              This is your recommended learning center based on your address. If you need a different location, please update your address or contact support.
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScheduling}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 