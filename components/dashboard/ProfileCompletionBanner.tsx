'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  onNavigateToProfile: () => void;
}

export default function ProfileCompletionBanner({
  completionPercentage,
  onNavigateToProfile,
}: ProfileCompletionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show if profile is incomplete
  if (completionPercentage === 100 || isDismissed) {
    return null;
  }

  const getMessage = () => {
    if (completionPercentage === 0) {
      return "Get started! Complete your profile to help us serve you better.";
    } else if (completionPercentage < 50) {
      return "You're just getting started! Complete your profile for a better experience.";
    } else if (completionPercentage < 100) {
      return "Almost there! Finish completing your profile so we can better assist you.";
    }
    return "Complete your profile";
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Profile Completion: {completionPercentage}%
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
              Complete Your Profile
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
