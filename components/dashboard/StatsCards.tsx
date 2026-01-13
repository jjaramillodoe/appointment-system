'use client';

import { CalendarDays, Award, MapPin, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  programInterests?: string[];
  closestHub?: {
    name: string;
  };
}

interface Appointment {
  appointmentDate: string;
  status: string;
}

interface StatsCardsProps {
  user: User;
  appointment: Appointment | null;
  parseToLocalDate: (dateValue: any) => Date | null;
}

export default function StatsCards({ user, appointment, parseToLocalDate }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-lg p-2 mr-4">
            <CalendarDays className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Next Appointment</p>
            <p className="text-2xl font-bold text-gray-900">
              {(() => { 
                const d = appointment && appointment.appointmentDate ? parseToLocalDate(appointment.appointmentDate) : null; 
                return d ? format(d, 'MMM dd') : 'None'; 
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-green-100 rounded-lg p-2 mr-4">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Programs</p>
            <p className="text-2xl font-bold text-gray-900">
              {user.programInterests?.length || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-purple-100 rounded-lg p-2 mr-4">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Learning Center</p>
            <p className="text-lg font-semibold text-gray-900">
              {user.closestHub?.name ? 'Assigned' : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="bg-orange-100 rounded-lg p-2 mr-4">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {appointment?.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 'No Appointment'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 