'use client';

import { 
  User, 
  Mail, 
  Phone, 
  Info, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  School 
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';
import { optionLabel } from '@/lib/i18n/labels';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sex: string;
  heardFrom: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  educationLevel: string;
  employmentStatus: string;
  schoolInterest?: string;
  programInterests?: string[];
  closestHub?: {
    name: string;
    address: string;
    distanceText: string;
  };
  barriersToLearning?: string[];
}

interface PersonalInfoCardProps {
  user: User;
  onEditAddress: () => void;
}

export default function PersonalInfoCard({ user, onEditAddress }: PersonalInfoCardProps) {
  const { t } = useI18n();
  const copy = t.dashboard.personalInfo;
  const options = t.dashboard.profile.options;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            {copy.title}
          </h2>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.name}</p>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Mail className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.email}</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Phone className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.phone}</p>
            <p className="font-medium text-gray-900">{user.phone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.sex}</p>
            <p className="font-medium text-gray-900">{optionLabel(options.sex, user.sex)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Info className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.heardFrom}</p>
            <p className="font-medium text-gray-900">{optionLabel(options.heardFrom, user.heardFrom)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <MapPin className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{copy.address}</p>
                <p className="font-medium text-gray-900">
                  {user.address?.street}, {user.address?.city}, {user.address?.state} {user.address?.zipCode}
                </p>
              </div>
              <button
                onClick={onEditAddress}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                aria-label={copy.editAddress}
              >
                {copy.edit}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <GraduationCap className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.educationLevel}</p>
            <p className="font-medium text-gray-900">{optionLabel(options.education, user.educationLevel)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Briefcase className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.employmentStatus}</p>
            <p className="font-medium text-gray-900">{optionLabel(options.employment, user.employmentStatus)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <School className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{copy.schoolInterest}</p>
            <p className="font-medium text-gray-900">{user.schoolInterest}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">{copy.programInterests}</h3>
          <div className="flex flex-wrap gap-2">
            {(user.programInterests || []).map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {optionLabel(options.program, interest)}
              </span>
            ))}
          </div>
        </div>

        {user.closestHub && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-1">{copy.recommendedCenter}</h4>
                <p className="text-green-700 text-sm mb-1">{user.closestHub.name}</p>
                <p className="text-green-600 text-xs mb-1">{user.closestHub.address}</p>
                <p className="text-green-600 text-xs">{fmt(copy.distance, { distance: user.closestHub.distanceText })}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">{copy.barriers}</h3>
          <div className="flex flex-wrap gap-2">
            {(user.barriersToLearning || []).map((barrier, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {optionLabel(options.barrier, barrier)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 