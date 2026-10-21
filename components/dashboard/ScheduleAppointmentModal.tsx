'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { hubCalendarToday } from '@/lib/slotDateTime';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';

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
  dayOffReason?: string;
  availableSlots: string[];
  user: any;
  hubConfigs: any[];
  isRescheduling?: boolean;
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
  dayOffReason,
  availableSlots,
  user,
  hubConfigs,
  isRescheduling = false,
}: ScheduleAppointmentModalProps) {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const copy = t.dashboard.schedule;
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  if (!isOpen) return null;

  const joinWaitlist = async () => {
    const hub = hubConfigs.find((item) => item.hubName === scheduleForm.selectedHub);
    if (!hub?._id || !token) {
      setWaitlistMessage(copy.waitlistSignIn);
      return;
    }
    setJoiningWaitlist(true);
    setWaitlistMessage('');
    const weekday = scheduleForm.appointmentDate
      ? new Date(`${scheduleForm.appointmentDate}T12:00:00`).getDay()
      : -1;
    const interests: string[] = user?.programInterests || [];
    const classInterest = interests.some((item) => /esl/i.test(item))
      ? 'ESL'
      : interests.some((item) => /basic|abe|hse|ged|be\/hse/i.test(item))
        ? 'BE/HSE'
        : undefined;
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hubId: hub._id,
          timePreference: weekday === 6 ? 'Saturday' : undefined,
          classInterest,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || copy.waitlistFailed);
      setWaitlistMessage(locale === 'en' && data.message ? data.message : copy.waitlistJoined);
    } catch (err: any) {
      setWaitlistMessage(err.message || copy.waitlistFailed);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 id="schedule-modal-title" className="text-lg font-semibold text-gray-900">
            {isRescheduling ? copy.titleReschedule : copy.titleSchedule}
          </h3>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            {copy.recommendedNote}
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.common.date}</label>
              <input
                id="schedule-date"
                type="date"
                value={scheduleForm.appointmentDate}
                min={hubCalendarToday()}
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
                <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.common.time}</label>
              <select
                id="schedule-time"
                value={scheduleForm.appointmentTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isDayOff || availableSlots.length === 0}
              >
                <option value="">{copy.selectTime}</option>
                {availableSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {isDayOff && (
                <p className="text-red-500 text-xs mt-1">
                  {dayOffReason ? fmt(copy.closedWithReason, { reason: dayOffReason }) : copy.closedDay}
                </p>
              )}
              {availableSlots.length === 0 && !isDayOff && scheduleForm.appointmentDate && (
                <div className="mt-2 space-y-2">
                  <p className="text-red-500 text-xs">{copy.noSlots}</p>
                  <button
                    type="button"
                    onClick={joinWaitlist}
                    disabled={joiningWaitlist}
                    className="text-sm font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50"
                  >
                    {joiningWaitlist ? copy.joining : copy.joinWaitlist}
                  </button>
                  {waitlistMessage && <p className="text-xs text-gray-600" role="status">{waitlistMessage}</p>}
                </div>
              )}
              {availableSlots.length > 0 && (
                <p className="text-green-600 text-xs mt-1">{fmt(copy.slotsAvailable, { count: availableSlots.length })}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="schedule-hub" className="block text-sm font-medium text-gray-700 mb-1">{copy.selectCenter}</label>
              <select
                id="schedule-hub"
                value={scheduleForm.selectedHub}
                onChange={e => setScheduleForm({ ...scheduleForm, selectedHub: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={!isRescheduling}
              >
                {isRescheduling ? (
                  <>
                    <option value="">{copy.selectCenterOption}</option>
                    {hubConfigs.map((hub) => (
                      <option key={hub._id} value={hub.hubName}>{hub.hubName}</option>
                    ))}
                  </>
                ) : user?.closestHub ? (
                  <option value={user.closestHub.name}>{user.closestHub.name} - {user.closestHub.address}</option>
                ) : (
                  <option value="">{copy.noHub}</option>
                )}
              </select>
            </div>
            <div className="text-xs text-gray-500 mt-2">{copy.recommendedNote}</div>
            
            <div>
              <label htmlFor="schedule-notes" className="block text-sm font-medium text-gray-700 mb-1">{copy.notes}</label>
              <textarea
                id="schedule-notes"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder={copy.notesPlaceholder}
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              {t.dashboard.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isScheduling || isDayOff || availableSlots.length === 0}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              {isScheduling ? (isRescheduling ? copy.saving : copy.scheduling) : (isRescheduling ? copy.submitReschedule : copy.submitSchedule)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 