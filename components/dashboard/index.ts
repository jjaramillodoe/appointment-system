// Dashboard Components Index
// Centralized exports for all dashboard-related components

// Core Dashboard Components
export { default as DashboardHeader } from './DashboardHeader';
export { default as TabNavigation } from './TabNavigation';
export { default as StatsCards } from './StatsCards';
export { default as PersonalInfoCard } from './PersonalInfoCard';
export { default as AppointmentPrintCard } from './AppointmentPrintCard';

// Tab Content Components
export { default as ProfileTab } from './ProfileTab';
export { default as AppointmentsTab } from './AppointmentsTab';
export { default as ProfileCompletionDashboard } from './ProfileCompletionDashboard';
export { default as ProfileCompletionBanner } from './ProfileCompletionBanner';
export { default as PendingProfileBanner } from './PendingProfileBanner';

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
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
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
    name?: string;
    relationship?: string;
    phone?: string;
  };
  closestHub?: {
    name: string;
    address: string;
    distanceText: string;
  };
  isAdmin?: boolean;
  profileCompleted?: boolean;
}

export interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'pending_profile' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
  notes: string;
  intakeType: string;
  hubName?: string;
  hubLocation?: string;
  publicTransitDirections?: string;
}

export interface ScheduleForm {
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  selectedHub: string;
} 