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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            Personal Information
          </h2>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Mail className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Phone className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{user.phone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sex</p>
            <p className="font-medium text-gray-900">{user.sex}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Info className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">How did you hear about us?</p>
            <p className="font-medium text-gray-900">{user.heardFrom}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <MapPin className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {user.address?.street}, {user.address?.city}, {user.address?.state} {user.address?.zipCode}
                </p>
              </div>
              <button
                onClick={onEditAddress}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <GraduationCap className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Education Level</p>
            <p className="font-medium text-gray-900">{user.educationLevel}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <Briefcase className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Employment Status</p>
            <p className="font-medium text-gray-900">{user.employmentStatus}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <School className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">School Interest</p>
            <p className="font-medium text-gray-900">{user.schoolInterest}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Program Interests</h3>
          <div className="flex flex-wrap gap-2">
            {(user.programInterests || []).map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {user.closestHub && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-1">Recommended Learning Center</h4>
                <p className="text-green-700 text-sm mb-1">{user.closestHub.name}</p>
                <p className="text-green-600 text-xs mb-1">{user.closestHub.address}</p>
                <p className="text-green-600 text-xs">{user.closestHub.distanceText} from your address</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Barriers to Learning</h3>
          <div className="flex flex-wrap gap-2">
            {(user.barriersToLearning || []).map((barrier, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {barrier}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 