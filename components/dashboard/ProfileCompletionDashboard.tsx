'use client';

import { CheckCircle2, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';
import { calculateProfileCompletion } from '@/lib/profileCompletion';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';

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

type FieldKey = keyof Dictionary['dashboard']['completion']['fields'];
type SectionKey = keyof Dictionary['dashboard']['completion']['sections'];

interface Section {
  key: SectionKey;
  fields: { key: FieldKey; done: boolean }[];
}

export default function ProfileCompletionDashboard({ user, onEditSection }: ProfileCompletionDashboardProps) {
  const { t } = useI18n();
  const copy = t.dashboard.completion;

  // Same rules the server uses to confirm a pending appointment
  const completion = calculateProfileCompletion(user);
  const missing = new Set(completion.missingFields);
  const isDone = (...names: string[]) => names.every((name) => !missing.has(name));

  const requiredSections: Section[] = [
    {
      key: 'personal',
      fields: [
        { key: 'phone', done: isDone('phone') },
        { key: 'dateOfBirth', done: isDone('dateOfBirth') },
        { key: 'sex', done: isDone('sex') },
      ],
    },
    {
      key: 'address',
      fields: [
        { key: 'currentAddress', done: isDone('address.street', 'address.city', 'address.state', 'address.zipCode') },
      ],
    },
    {
      key: 'emergency',
      fields: [
        { key: 'contactName', done: isDone('emergencyContact.name') },
        { key: 'relationship', done: isDone('emergencyContact.relationship') },
        { key: 'contactPhone', done: isDone('emergencyContact.phone') },
      ],
    },
    {
      key: 'education',
      fields: [
        { key: 'educationLevel', done: isDone('educationLevel') },
        { key: 'programInterests', done: isDone('programInterests') },
        { key: 'schoolInterest', done: isDone('schoolInterest') },
      ],
    },
  ];

  const optionalSections: Section[] = [
    {
      key: 'about',
      fields: [
        { key: 'heardFrom', done: Boolean(user.heardFrom) },
        { key: 'additionalLanguages', done: Boolean(user.additionalLanguages?.length) },
      ],
    },
    {
      key: 'employment',
      fields: [
        { key: 'employmentStatus', done: Boolean(user.employmentStatus) },
        { key: 'employerName', done: Boolean(user.employerName) },
        { key: 'jobTitle', done: Boolean(user.jobTitle) },
      ],
    },
    {
      key: 'other',
      fields: [
        { key: 'barriers', done: Boolean(user.barriersToLearning?.length) },
        { key: 'homeAddress', done: Boolean(user.homeAddress?.street) },
      ],
    },
  ];

  const requiredItems = requiredSections.flatMap((section) => section.fields);
  const requiredDone = requiredItems.filter((field) => field.done).length;
  const optionalItems = optionalSections.flatMap((section) => section.fields);
  const optionalDone = optionalItems.filter((field) => field.done).length;
  const percentage = completion.percentage;

  const status =
    percentage === 100 ? { emoji: '✨', label: copy.statusComplete } :
    percentage >= 75 ? { emoji: '🎯', label: copy.statusAlmost } :
    percentage >= 50 ? { emoji: '👍', label: copy.statusHalf } :
    { emoji: '📝', label: copy.statusStart };

  const renderSection = (section: Section, required: boolean) => {
    const title = copy.sections[section.key];
    return (
      <div
        key={section.key}
        className={`bg-white rounded-lg border p-5 hover:shadow-md transition-shadow ${required ? 'border-primary-200' : 'border-blue-200'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-primary-900 mb-3">{title}</h4>
            <ul className="space-y-2">
              {section.fields.map((field) => (
                <li key={field.key} className="flex items-center gap-3">
                  {field.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden />
                  ) : required ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" aria-hidden />
                  ) : (
                    <span className="h-5 w-5 border-2 border-gray-300 rounded-full flex-shrink-0" aria-hidden />
                  )}
                  <span className={`text-sm ${field.done ? 'text-primary-700' : 'text-primary-600'}`}>
                    {copy.fields[field.key]}
                    <span className="sr-only"> ({field.done ? copy.itemDone : copy.itemMissing})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onEditSection(section.key)}
            className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label={fmt(copy.editSection, { section: title })}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Header Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">{percentage}%</h2>
            <p className="text-primary-100 mt-1">{copy.percentLabel}</p>
          </div>
          <div className="text-5xl" aria-hidden>{status.emoji}</div>
        </div>

        <div
          className="w-full bg-white/20 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={copy.percentLabel}
        >
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-4 flex justify-between text-sm text-primary-100">
          <span>{fmt(copy.progress, { done: requiredDone, total: requiredItems.length })}</span>
          <span>{status.label}</span>
        </div>
      </div>

      {/* Required to confirm */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" aria-hidden />
          <h3 className="text-lg font-semibold text-primary-900">{copy.requiredTitle}</h3>
          <span className="text-sm font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
            {requiredDone}/{requiredItems.length}
          </span>
        </div>
        {requiredSections.map((section) => renderSection(section, true))}
      </div>

      {/* Optional */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" aria-hidden />
          <h3 className="text-lg font-semibold text-primary-900">{copy.optionalTitle}</h3>
          <span className="text-sm font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {optionalDone}/{optionalItems.length}
          </span>
        </div>
        {optionalSections.map((section) => renderSection(section, false))}
      </div>

      {completion.isComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 text-center" role="status">
          <h3 className="text-xl font-bold text-green-700">🎉 {copy.doneTitle}</h3>
          <p className="text-green-600 mt-2">{copy.doneText}</p>
        </div>
      )}
    </div>
  );
}
