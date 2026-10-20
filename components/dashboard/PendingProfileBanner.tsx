'use client';

import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';
import { dateFnsLocale } from '@/lib/i18n/labels';

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
  const { t, locale } = useI18n();
  const copy = t.dashboard.pendingBanner;
  const date = appointmentDate ? parseToLocalDate(appointmentDate) : null;
  const dateLabel = date ? format(date, 'PPPP', { locale: dateFnsLocale(locale) }) : copy.fallbackDate;
  const timeLabel = appointmentTime ? formatTime(appointmentTime) : copy.fallbackTime;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">{copy.title}</h3>
          <p className="text-amber-800 text-sm mb-3">
            {fmt(copy.text, { date: dateLabel, time: timeLabel })}
          </p>
          <button
            onClick={onCompleteProfile}
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {copy.button}
          </button>
        </div>
      </div>
    </div>
  );
}
