'use client';

import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle, 
  Trash2, 
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  intakeType: string;
  hubName?: string;
}

interface ScheduleForm {
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  selectedHub: string;
}

interface AppointmentsTabProps {
  appointment: Appointment | null;
  onScheduleClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  error: string;
  parseToLocalDate: (dateValue: any) => Date | null;
  formatTime: (time: string | undefined) => string;
  showScheduleForm: boolean;
  scheduleForm: ScheduleForm;
  setScheduleForm: (form: ScheduleForm) => void;
  onSubmitSchedule: (e: React.FormEvent) => void;
  onCloseSchedule: () => void;
  isScheduling: boolean;
  isDayOff: boolean;
  availableSlots: string[];
  hubConfigs: any[];
  user: any;
}

export default function AppointmentsTab({
  appointment,
  onScheduleClick,
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
  error,
  parseToLocalDate,
  formatTime,
  showScheduleForm,
  scheduleForm,
  setScheduleForm,
  onSubmitSchedule,
  onCloseSchedule,
  isScheduling,
  isDayOff,
  availableSlots,
  hubConfigs,
  user
}: AppointmentsTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              My Appointments
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {appointment ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">
                      Upcoming Appointment
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <span className="text-sm text-blue-600 font-medium">Date</span>
                      <p className="text-blue-900 font-semibold mt-1">
                        {(() => { 
                          const d = parseToLocalDate(appointment.appointmentDate); 
                          return d ? format(d, 'EEEE, MMMM do, yyyy') : appointment.appointmentDate; 
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <span className="text-sm text-blue-600 font-medium">Time</span>
                      <p className="text-blue-900 font-semibold mt-1">
                        {appointment?.appointmentTime ? formatTime(appointment.appointmentTime) : 'Time not available'}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <span className="text-sm text-blue-600 font-medium">Location</span>
                      <p className="text-blue-900 font-semibold mt-1">
                        {appointment.hubName || 'Learning Center'}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
                      <span className="text-sm text-blue-600 font-medium">Notes</span>
                      <p className="text-blue-900 mt-1">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={onConfirm}
                  disabled={isConfirming || appointment.status === 'confirmed'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {appointment.status === 'confirmed' ? 'Confirmed' : 'Confirm Attendance'}
                    </>
                  )}
                </button>
                
                <button
                  onClick={onCancel}
                  disabled={isCancelling}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
              <p className="text-gray-600 mb-6">You don't have any appointments scheduled yet.</p>
              <button
                onClick={onScheduleClick}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Schedule Your Appointment</h2>
              
              <form onSubmit={onSubmitSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.appointmentDate}
                    min={(() => {
                      const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
                      if (!selectedHubConfig) return format(new Date(), 'yyyy-MM-dd');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return format(tomorrow, 'yyyy-MM-dd');
                    })()}
                    onChange={(e) => {
                      const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
                      if (selectedHubConfig && e.target.value) {
                        setScheduleForm({ ...scheduleForm, appointmentDate: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Time
                  </label>
                  <select
                    value={scheduleForm.appointmentTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a time</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {isDayOff && (
                    <p className="text-sm text-red-600 mt-1">
                      This location is closed on the selected date.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Center
                  </label>
                  <select
                    value={scheduleForm.selectedHub}
                    onChange={e => setScheduleForm({ ...scheduleForm, selectedHub: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a learning center</option>
                    {hubConfigs.map((hub) => (
                      <option key={hub._id} value={hub.hubName}>
                        {hub.hubName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Any additional information or special requests..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onCloseSchedule}
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
        </div>
      )}
    </div>
  );
} 