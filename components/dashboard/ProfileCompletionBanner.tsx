'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  onNavigateToProfile: () => void;
}

export default function ProfileCompletionBanner({
  completionPercentage,
  onNavigateToProfile,
}: ProfileCompletionBannerProps) {
  const { t } = useI18n();
  const copy = t.dashboard.completionBanner;
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show if profile is incomplete
  if (completionPercentage === 100 || isDismissed) {
    return null;
  }

  const getMessage = () => {
    if (completionPercentage === 0) return copy.start;
    if (completionPercentage < 50) return copy.low;
    return copy.high;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              {fmt(copy.title, { percent: completionPercentage })}
            </h3>
            <p className="text-blue-800 text-sm mb-3">{getMessage()}</p>

            {/* Progress bar */}
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <button
              onClick={onNavigateToProfile}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {copy.button}
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
          aria-label={copy.dismiss}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
