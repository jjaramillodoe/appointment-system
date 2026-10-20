'use client';

import { logger } from '@/lib/logger';

import { useState } from 'react';
import { FileDown, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { downloadAppointmentPdf } from '@/lib/appointmentPdf';
import { downloadAppointmentIcs } from '@/lib/appointmentIcs';
import { useI18n } from '@/contexts/I18nContext';
import { dateFnsLocale, statusLabel } from '@/lib/i18n/labels';
import { findHubByName } from '@/utils/hubMatching';

interface AppointmentPrintCardProps {
  appointment: {
    appointmentDate: string;
    appointmentTime: string;
    status?: string;
    notes?: string;
    hubName?: string;
    hubLocation?: string;
    publicTransitDirections?: string;
  };
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    closestHub?: { name?: string; address?: string };
  };
  parseToLocalDate: (dateValue: any) => Date | null;
  formatTime: (time: string | undefined) => string;
}

export default function AppointmentPrintCard({
  appointment,
  user,
  parseToLocalDate,
  formatTime,
}: AppointmentPrintCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const { t, locale } = useI18n();
  const copy = t.dashboard.printCard;
  const date = parseToLocalDate(appointment.appointmentDate);
  const dateLabel = date ? format(date, 'PPPP', { locale: dateFnsLocale(locale) }) : copy.dateTbc;
  const timeLabel = formatTime(appointment.appointmentTime);
  const hub = findHubByName(appointment.hubName || user.closestHub?.name);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError('');
    try {
      await downloadAppointmentPdf({
        studentName: [user.firstName, user.lastName].filter(Boolean).join(' ') || t.dashboard.pdf.student,
        email: user.email,
        phone: user.phone,
        dateLabel,
        timeLabel,
        statusLabel: statusLabel(t, appointment.status),
        hubName: appointment.hubName || hub?.name || user.closestHub?.name,
        hubLocation: appointment.hubLocation || hub?.address || user.closestHub?.address,
        notes: appointment.notes,
        directions: appointment.publicTransitDirections || hub?.publicTransitDirections,
        copy: t.dashboard.pdf,
      });
    } catch (err) {
      logger.error(err);
      setError(copy.failed);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-2 mr-3">
            <Printer className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">{copy.title}</h2>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">{copy.intro}</p>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
          <p className="font-medium text-gray-900">{dateLabel}</p>
          <p className="text-gray-700">{timeLabel}</p>
          <p className="text-gray-500 mt-1">{statusLabel(t, appointment.status)}</p>
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          {isDownloading ? copy.preparing : copy.download}
        </button>
        <button
          type="button"
          onClick={() => downloadAppointmentIcs({
            date: appointment.appointmentDate,
            time: appointment.appointmentTime,
            hubName: appointment.hubName || hub?.name || user.closestHub?.name,
            hubLocation: appointment.hubLocation || hub?.address || user.closestHub?.address,
          })}
          className="w-full inline-flex items-center justify-center gap-2 border border-primary-200 bg-white text-primary-800 px-4 py-2.5 rounded-lg font-medium hover:bg-primary-50"
        >
          {copy.addToCalendar}
        </button>
      </div>
    </div>
  );
}
