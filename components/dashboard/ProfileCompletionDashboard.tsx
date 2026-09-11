'use client';

import { CheckCircle2, AlertCircle, ChevronRight, Lock } from 'lucide-react';

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  sex?: string;
  preferredLanguage?: string;
  additionalLanguages?: string[];
  heardFrom?: string;
  barriersToLearning?: string[];
  homeAddress?: { street?: string; city?: string; state?: string; zipCode?: string };
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  educationLevel?: string;
  employmentStatus?: string;
  employerName?: string;
  jobTitle?: string;
  schoolInterest?: string;
  programInterests?: string[];
  emergencyContact?: { name?: string; relationship?: string; phone?: string };
}

interface ProfileCompletionDashboardProps {
  user: User;
  onEditSection: (section: string) => void;
}

export default function ProfileCompletionDashboard({ user, onEditSection }: ProfileCompletionDashboardProps) {
  // Calculate completion percentage
  const requiredFields = {
    'Basic Info': [
      { key: 'firstName', label: 'First Name', value: user.firstName },
      { key: 'lastName', label: 'Last Name', value: user.lastName },
      { key: 'email', label: 'Email', value: user.email },
      { key: 'phone', label: 'Phone', value: user.phone },
      { key: 'preferredLanguage', label: 'Preferred Language', value: user.preferredLanguage },
    ],
  };

  const optionalFields = {
    'Personal Details': [
      { key: 'dateOfBirth', label: 'Date of Birth', value: user.dateOfBirth },
      { key: 'sex', label: 'Gender', value: user.sex },
    ],
    'Education & Employment': [
      { key: 'educationLevel', label: 'Education Level', value: user.educationLevel },
      { key: 'employmentStatus', label: 'Employment Status', value: user.employmentStatus },
      { key: 'schoolInterest', label: 'School Interest', value: user.schoolInterest },
      { key: 'programInterests', label: 'Program Interests', value: user.programInterests?.length ? user.programInterests : null },
    ],
    'Emergency Contact': [
      { key: 'emergencyContact', label: 'Emergency Contact', value: user.emergencyContact?.name },
    ],
    'Address Information': [
      { key: 'address', label: 'Current Address', value: user.address?.street },
      { key: 'homeAddress', label: 'Home Address', value: user.homeAddress?.street },
    ],
  };

  // Count completed fields
  const requiredCompleted = Object.values(requiredFields)
    .flat()
    .filter(field => field.value).length;
  const requiredTotal = Object.values(requiredFields).flat().length;

  const optionalCompleted = Object.values(optionalFields)
    .flat()
    .filter(field => field.value).length;
  const optionalTotal = Object.values(optionalFields).flat().length;

  const totalCompleted = requiredCompleted + optionalCompleted;
  const totalFields = requiredTotal + optionalTotal;
  const completionPercentage = Math.round((totalCompleted / totalFields) * 100);

  const completionStatus =
    completionPercentage === 100 ? '✨ Complete!' :
    completionPercentage >= 75 ? '🎯 Almost there!' :
    completionPercentage >= 50 ? '👍 Halfway done' :
    '📝 Get started';

  return (
    <div className="space-y-6">
      {/* Progress Header Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">{completionPercentage}%</h2>
            <p className="text-primary-100 mt-1">Profile Complete</p>
          </div>
          <div className="text-5xl">{completionStatus.split(' ')[0]}</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="mt-4 flex justify-between text-sm text-primary-100">
          <span>{totalCompleted} of {totalFields} fields completed</span>
          <span>{completionStatus}</span>
        </div>
      </div>

      {/* Required Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-primary-900">Required Information</h3>
          <span className="text-sm font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
            {requiredCompleted}/{requiredTotal}
          </span>
        </div>

        {Object.entries(requiredFields).map(([section, fields]) => (
          <div key={section} className="bg-white rounded-lg border border-primary-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 mb-3">{section}</h4>
                <div className="space-y-2">
                  {fields.map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      {field.value ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-primary-700">{field.label}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-primary-600">{field.label}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onEditSection(section)}
                className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-primary-900">Optional Information</h3>
          <span className="text-sm font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {optionalCompleted}/{optionalTotal}
          </span>
        </div>

        {Object.entries(optionalFields).map(([section, fields]) => (
          <div key={section} className="bg-white rounded-lg border border-blue-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 mb-3">{section}</h4>
                <div className="space-y-2">
                  {fields.map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      {field.value ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-primary-700">{field.label}</span>
                        </>
                      ) : (
                        <>
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                          <span className="text-sm text-primary-500">{field.label}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onEditSection(section)}
                className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completionPercentage === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-green-700">🎉 Your profile is complete!</h3>
          <p className="text-green-600 mt-2">You're all set for your appointment.</p>
        </div>
      )}
    </div>
  );
}
