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
  appointmentHubName?: string;
}

export default function StatsCards({ user, appointment, parseToLocalDate, appointmentHubName }: StatsCardsProps) {
  const StatCard = ({ icon: Icon, bgColor, textColor, label, value }: any) => (
    <div className={`${bgColor} rounded-2xl shadow-lg p-6 border border-white/20 backdrop-blur-sm hover:shadow-xl transition-all`}>
      <div className="flex items-center">
        <div className={`${textColor} rounded-xl p-3 mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={CalendarDays}
        bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
        textColor="bg-blue-400/30 text-blue-100"
        label="Next Appointment"
        value={(() => {
          const d = appointment && appointment.appointmentDate ? parseToLocalDate(appointment.appointmentDate) : null;
          return d ? format(d, 'MMM dd') : 'None';
        })()}
      />

      <StatCard
        icon={Award}
        bgColor="bg-gradient-to-br from-green-500 to-green-600"
        textColor="bg-green-400/30 text-green-100"
        label="Programs"
        value={user.programInterests?.length || 0}
      />

      <StatCard
        icon={MapPin}
        bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
        textColor="bg-purple-400/30 text-purple-100"
        label="Learning Center"
        value={appointmentHubName || user.closestHub?.name || 'Pending'}
      />

      <StatCard
        icon={TrendingUp}
        bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
        textColor="bg-yellow-400/30 text-yellow-100"
        label="Status"
        value={appointment?.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 'No Appointment'}
      />
    </div>
  );
} 