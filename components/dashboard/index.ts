// Dashboard Components Index
// Centralized exports for all dashboard-related components

// Core Dashboard Components
export { default as DashboardHeader } from './DashboardHeader';
export { default as TabNavigation } from './TabNavigation';
export { default as StatsCards } from './StatsCards';
export { default as PersonalInfoCard } from './PersonalInfoCard';

// Tab Content Components
export { default as ProfileTab } from './ProfileTab';
export { default as AppointmentsTab } from './AppointmentsTab';

// Appointment Components
export { default as AppointmentCard } from './AppointmentCard';
export { default as ScheduleAppointmentModal } from './ScheduleAppointmentModal';

// Modal Components
export { default as AddressEditModal } from './AddressEditModal';

// Type definitions that might be shared across components
export type TabType = 'dashboard' | 'profile' | 'appointments';

export interface User {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  sex: string;
  preferredLanguage: string;
  additionalLanguages?: string[];
  heardFrom: string;
  barriersToLearning: string[];
  homeAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  educationLevel: string;
  employmentStatus: string;
  employerName?: string;
  jobTitle?: string;
  schoolInterest?: string;
  programInterests?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  closestHub?: {
    name: string;
    address: string;
    distanceText: string;
  };
  isAdmin?: boolean;
}

export interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  intakeType: string;
  hubName?: string;
}

export interface ScheduleForm {
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  selectedHub: string;
} 