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
import { appointmentStatusLabel, isPendingProfile } from '@/lib/appointmentStatus';
import StudentWaitlistCard from './StudentWaitlistCard';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'pending_profile' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
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
  history?: Appointment[];
  onScheduleClick: () => void;
  onReschedule?: () => void;
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
  dayOffReason?: string;
  availableSlots: string[];
  hubConfigs: any[];
  user: any;
}

export default function AppointmentsTab({
  appointment,
  history = [],
  onScheduleClick,
  onReschedule,
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
  dayOffReason,
  availableSlots,
  hubConfigs,
  user
}: AppointmentsTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'pending_profile':
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
                      <span className="ml-1">{appointmentStatusLabel(appointment.status)}</span>
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
                {isPendingProfile(appointment.status) ? (
                  <button
                    onClick={() => window.location.assign('/dashboard?tab=profile')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    Complete Profile to Confirm
                  </button>
                ) : (
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
                )}
                
                {onReschedule && (
                  <button
                    onClick={onReschedule}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Reschedule
                  </button>
                )}
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

      {history.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment history</h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="font-medium text-gray-900">{item.hubName || 'Learning center'}</p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const d = parseToLocalDate(item.appointmentDate);
                      return d ? format(d, 'MMM d, yyyy') : '';
                    })()} · {formatTime(item.appointmentTime)}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{appointmentStatusLabel(item.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StudentWaitlistCard />
    </div>
  );
} 