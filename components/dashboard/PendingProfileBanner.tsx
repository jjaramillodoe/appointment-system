'use client';

import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface PendingProfileBannerProps {
  appointmentDate?: string;
  appointmentTime?: string;
  parseToLocalDate: (dateValue: any) => Date | null;
  formatTime: (time: string | undefined) => string;
  onCompleteProfile: () => void;
}

export default function PendingProfileBanner({
  appointmentDate,
  appointmentTime,
  parseToLocalDate,
  formatTime,
  onCompleteProfile,
}: PendingProfileBannerProps) {
  const date = appointmentDate ? parseToLocalDate(appointmentDate) : null;
  const dateLabel = date ? format(date, 'EEEE, MMMM d, yyyy') : 'your scheduled date';
  const timeLabel = appointmentTime ? formatTime(appointmentTime) : 'the reserved time';

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">Appointment Unconfirmed</h3>
          <p className="text-amber-800 text-sm mb-3">
            Your appointment on {dateLabel} at {timeLabel} is currently unconfirmed. Please complete your student profile to confirm your registration.
          </p>
          <button
            onClick={onCompleteProfile}
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Complete Your Profile
          </button>
        </div>
      </div>
    </div>
  );
}
