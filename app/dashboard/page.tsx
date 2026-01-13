'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { HUBS } from '@/utils/hubMatching';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

// Import our new dashboard components
import {
  DashboardHeader,
  TabNavigation,
  StatsCards,
  PersonalInfoCard,
  ProfileTab,
  AppointmentsTab,
  AppointmentCard,
  ScheduleAppointmentModal,
  AddressEditModal,
  type TabType,
  type User,
  type Appointment,
  type ScheduleForm
} from '@/components/dashboard';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Utility to handle various date formats
function parseToLocalDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') {
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // ISO string (UTC)
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      // If time is 00:00:00Z, treat as UTC and construct local date from UTC parts
      if (dateValue.endsWith('T00:00:00.000Z')) {
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const day = d.getUTCDate();
        return new Date(year, month, day);
      }
      return d;
    }
  }
  if (typeof dateValue === 'object' && dateValue.$date) {
    const d = new Date(dateValue.$date);
    if (!isNaN(d.getTime())) {
      // If time is 00:00:00Z, treat as UTC and construct local date from UTC parts
      if (dateValue.$date.endsWith('T00:00:00.000Z')) {
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const day = d.getUTCDate();
        return new Date(year, month, day);
      }
      return d;
    }
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();
  const { user: authUser, token, isAuthenticated, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: '',
    preferredLanguage: '',
    additionalLanguages: [] as string[],
    heardFrom: '',
    barriersToLearning: [] as string[],
    homeAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    educationLevel: '',
    employmentStatus: '',
    employerName: '',
    jobTitle: '',
    schoolInterest: '',
    programInterests: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Appointment scheduling
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    selectedHub: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [calendarValue, setCalendarValue] = useState<Value>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isDayOff, setIsDayOff] = useState(false);
  const [hubConfigs, setHubConfigs] = useState<any[]>([]);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);

  // Helper function to format time with improved error handling
  const formatTime = (time: string | undefined): string => {
    if (!time) return 'Time not available';
    
    try {
      // Handle various time formats
      const timeStr = time.toString();
      
      // If it's already in 12-hour format, return as-is
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        return timeStr;
      }
      
      // If it's in 24-hour format (HH:MM), convert to 12-hour
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hourStr, minute] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute} ${period}`;
      }
      
      return timeStr;
    } catch (error) {
      console.warn('Error formatting time:', time, error);
      return 'Time not available';
    }
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    try {
      if (!time12h.includes('AM') && !time12h.includes('PM')) {
        return time12h; // Already in 24-hour format
      }
      
      const [time, period] = time12h.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours, 10);
      
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.warn('Error converting time to 24-hour format:', time12h, error);
      return time12h;
    }
  };

  // Load user data and fetch appointment on component mount
  useEffect(() => {
    // Use AuthContext instead of localStorage
    if (authLoading) return; // Wait for auth to load

    if (!token || !authUser) {
      console.log('❌ No authentication found, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('👤 User loaded from AuthContext:', authUser.email);
    setUser(authUser);

    // Fetch user's appointment
    console.log('🔍 Fetching appointment with token:', token ? 'Present' : 'Missing');
    fetch('/api/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        console.log('📡 API Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ API Response data:', data);
        if (data.appointment) {
          console.log('📅 Appointment found:', data.appointment);
          setAppointment(data.appointment);
        } else {
          console.log('📝 No appointment found for user');
          setAppointment(null);
        }
      })
      .catch(error => {
        console.error('❌ Error fetching appointment:', error);
        setAppointment(null);
      })
      .finally(() => {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      });

  }, [authLoading, token, authUser, router]);

  // Populate profile form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? (new Date(user.dateOfBirth)).toISOString().split('T')[0] : '',
        sex: user.sex || '',
        preferredLanguage: user.preferredLanguage || '',
        additionalLanguages: user.additionalLanguages || [],
        heardFrom: user.heardFrom || '',
        barriersToLearning: user.barriersToLearning || [],
        homeAddress: {
          street: user.homeAddress?.street || user.address?.street || '',
          city: user.homeAddress?.city || user.address?.city || '',
          state: user.homeAddress?.state || user.address?.state || '',
          zipCode: user.homeAddress?.zipCode || user.address?.zipCode || ''
        },
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        educationLevel: user.educationLevel || '',
        employmentStatus: user.employmentStatus || '',
        employerName: user.employerName || '',
        jobTitle: user.jobTitle || '',
        schoolInterest: user.schoolInterest || '',
        programInterests: user.programInterests || [],
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || ''
        }
      });

      // Initialize address form for editing
      if (user.address) {
        setAddressForm({
          street: user.address.street || '',
          city: user.address.city || '',
          state: user.address.state || '',
          zipCode: user.address.zipCode || ''
        });
      }
    }
  }, [user]);

  // Fetch hub configs on mount - Updated to use new Hub API
  useEffect(() => {
    fetch('/api/admin/hubs')
      .then(res => res.json())
      .then(hubs => {
        // Convert hub data to match expected format
        const hubConfigs = hubs.map((hub: any) => ({
          hubName: hub.name,
          _id: hub._id,
          defaultSlots: hub.defaultSlots || [],
          daysOff: [], // Will be fetched from HubSchedule
          customSlots: {} // Will be fetched from HubSchedule
        }));
        setHubConfigs(hubConfigs);
      })
      .catch(error => console.error('Error fetching hubs:', error));
  }, []);

  // Update available slots when hub or date changes - Updated to use optimized API
  useEffect(() => {
    if (!scheduleForm.selectedHub || !scheduleForm.appointmentDate) {
      setAvailableSlots([]);
      setIsDayOff(false);
      return;
    }

    const fetchOptimizedAvailability = async () => {
      try {
        // Find hub ID from hub name
        const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
        if (!selectedHubConfig?._id) {
          console.warn('Hub ID not found for:', scheduleForm.selectedHub);
          return;
        }

        const response = await fetch(`/api/availability?hubId=${selectedHubConfig._id}&date=${scheduleForm.appointmentDate}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Optimized availability data:', data);
          
          if (data.success && data.data) {
            setIsDayOff(data.data.isDayOff);
            if (data.data.isDayOff) {
              setAvailableSlots([]);
            } else {
              // Convert slots to time strings and filter available ones
              const availableTimes = data.data.slots
                .filter((slot: any) => slot.available > 0)
                .map((slot: any) => slot.time);
              setAvailableSlots(availableTimes);
            }
          }
        } else {
          console.error('Failed to fetch optimized availability:', response.status);
        }
      } catch (error) {
        console.error('Error fetching optimized availability:', error);
      }
    };

    fetchOptimizedAvailability();
  }, [scheduleForm.selectedHub, scheduleForm.appointmentDate, hubConfigs]);

  // Update selectedHub when user data is loaded or when schedule form is opened
  useEffect(() => {
    if (user?.closestHub?.name && (!scheduleForm.selectedHub || showScheduleForm)) {
      setScheduleForm(prev => ({
        ...prev,
        selectedHub: user.closestHub!.name
      }));
    }
  }, [user, scheduleForm.selectedHub, showScheduleForm]);

  // Initialize map when appointment is available
  useEffect(() => {
    if (!appointment) return;

    // Set your Mapbox access token here
    // You'll need to get a free token from https://account.mapbox.com/
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

    if (!mapboxgl.accessToken || mapboxgl.accessToken.includes('example')) {
      console.warn('Mapbox token not configured properly');
      return;
    }

    // Find the hub for this appointment
    const hubName = user?.closestHub?.name || HUBS[0].name;
    const selectedHub = HUBS.find(hub => hub.name === hubName);
    
    if (!selectedHub) {
      console.warn('Hub not found for map initialization');
      return;
    }

    // Wait for the map container to be in the DOM
    const mapContainer = document.getElementById('appointment-map');
    if (!mapContainer) {
      console.warn('Map container not found');
      return;
    }

    try {
      // Initialize map
      const mapInstance = new mapboxgl.Map({
        container: 'appointment-map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [selectedHub.longitude, selectedHub.latitude],
        zoom: 14
      });

      // Add marker for the hub
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([selectedHub.longitude, selectedHub.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${selectedHub.name}</h3>
            <p class="text-sm text-gray-600">${selectedHub.address}</p>
          </div>
        `))
        .addTo(mapInstance);

      setMap(mapInstance);

      // Cleanup function
      return () => {
        if (mapInstance) {
          mapInstance.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [appointment, user]);

  // Event Handlers
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    setError('');

    console.log('🚀 Starting appointment booking process...');
    console.log('📋 Schedule form data:', scheduleForm);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('👤 User data from localStorage:', userData ? 'Present' : 'Missing');
    console.log('🔐 Token from localStorage:', token ? 'Present' : 'Missing');

    if (!token || !userData) {
      setError('Authentication required');
      setIsScheduling(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('🧑 Parsed user:', { id: parsedUser.id || parsedUser._id, email: parsedUser.email, name: parsedUser.name || `${parsedUser.firstName} ${parsedUser.lastName}` });

      // Find hub ID
      console.log('🏢 Looking for hub:', scheduleForm.selectedHub);
      console.log('🏢 Available hubs:', hubConfigs.map(h => h.hubName));
      
      const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
      
      if (!selectedHubConfig?._id) {
        throw new Error('Selected hub not found');
      }

      console.log('🏢 Selected hub config:', selectedHubConfig);

      // Convert 12-hour time to 24-hour format for backend
      const time24h = convertTo24Hour(scheduleForm.appointmentTime);

      const bookingData = {
        action: 'book',
        hubId: selectedHubConfig._id,
        date: scheduleForm.appointmentDate,
        time: time24h,
        userId: parsedUser.id || parsedUser._id,
        notes: scheduleForm.notes,
        intakeType: 'adult-education'
      };

      console.log('📤 Sending booking request with data:', bookingData);

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      console.log('📡 Booking response status:', response.status);

      const data = await response.json();
      console.log('📋 Booking response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule appointment');
      }

      if (!data.success) {
        throw new Error(data.error || 'Booking failed');
      }

      console.log('✅ Booking successful, updating local state...');

      // Update local appointment state with proper typing
      const newAppointment: Appointment = {
        _id: data.appointmentId || 'temp-id',
        appointmentDate: scheduleForm.appointmentDate,
        appointmentTime: scheduleForm.appointmentTime, // Keep original format for display
        status: 'confirmed' as const,
        notes: scheduleForm.notes,
        intakeType: 'adult-education',
        hubName: scheduleForm.selectedHub
      };

      setAppointment(newAppointment);
      setShowScheduleForm(false);
      setScheduleForm({ appointmentDate: '', appointmentTime: '', notes: '', selectedHub: user?.closestHub?.name || '' });
      
      // Show success message
      setError('');
      console.log('✅ Appointment scheduled successfully using optimized API');
      showSuccess('Appointment scheduled successfully!');

    } catch (err: any) {
      console.error('❌ Booking error:', err);
      setError(err.message || 'Failed to schedule appointment');
      showError(err.message || 'Failed to schedule appointment');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelAppointment = async () => {
    setIsCancelling(true);
    setError('');

    const token = localStorage.getItem('token');
    
    if (!token) {
      showError('Authentication required');
      setIsCancelling(false);
      return;
    }

    try {
      // Use the student appointments DELETE endpoint
      const response = await fetch('/api/appointments', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      setAppointment(null);
      console.log('✅ Appointment cancelled and permanently deleted from system');
      
      // Show success toast
      setError('');
      showSuccess('Your appointment has been successfully cancelled and removed from your dashboard.', 6000);

    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
      showError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmAppointment = async () => {
    setIsConfirming(true);
    setError('');

    try {
      // For the optimized system, we'll just update the local state
      // In a full implementation, you'd call an API to update the appointment status
      if (appointment) {
        const updatedAppointment: Appointment = {
          ...appointment,
          status: 'confirmed' as 'confirmed'
        };
        setAppointment(updatedAppointment);
        setError('');
        setShowConfirmationSuccess(true);
        // Hide success message after 5 seconds
        setTimeout(() => setShowConfirmationSuccess(false), 5000);
        console.log('✅ Appointment confirmed successfully');
        showSuccess('Appointment confirmed successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm appointment');
      showError(err.message || 'Failed to confirm appointment');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleUpdateAddress = async (addressData: typeof addressForm) => {
    setIsUpdatingAddress(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/update-address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update address');
      }

      // Update local user data
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditingAddress(false);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zipCode: ''
      });
      showSuccess('Address updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update address');
      showError(err.message || 'Failed to update address');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditingProfile(false);
        showSuccess('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showError('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    // Reset form to current user data
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? (new Date(user.dateOfBirth)).toISOString().split('T')[0] : '',
        sex: user.sex || '',
        preferredLanguage: user.preferredLanguage || '',
        additionalLanguages: user.additionalLanguages || [],
        heardFrom: user.heardFrom || '',
        barriersToLearning: user.barriersToLearning || [],
        homeAddress: {
          street: user.homeAddress?.street || user.address?.street || '',
          city: user.homeAddress?.city || user.address?.city || '',
          state: user.homeAddress?.state || user.address?.state || '',
          zipCode: user.homeAddress?.zipCode || user.address?.zipCode || ''
        },
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        educationLevel: user.educationLevel || '',
        employmentStatus: user.employmentStatus || '',
        employerName: user.employerName || '',
        jobTitle: user.jobTitle || '',
        schoolInterest: user.schoolInterest || '',
        programInterests: user.programInterests || [],
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || ''
        }
      });
    }
  };

  const handleSendSms = async () => {
    if (!appointment) return;

    setIsSendingSms(true);
    setSmsError('');
    setSmsSuccess(false);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/send-appointment-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: appointment._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSmsSuccess(true);
        if (data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
        }
        showSuccess('SMS sent successfully! Check your phone.');
      } else {
        setSmsError(data.error || 'Failed to send SMS');
        showError(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS error:', error);
      setSmsError('Failed to send SMS');
      showError('Failed to send SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <StatsCards 
              user={user} 
              appointment={appointment} 
              parseToLocalDate={parseToLocalDate} 
            />

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Personal Info */}
              <div className="lg:col-span-1">
                <PersonalInfoCard 
                  user={user} 
                  onEditAddress={() => setIsEditingAddress(true)} 
                />
              </div>

              {/* Right Column - Appointment */}
              <div className="lg:col-span-2">
                <AppointmentCard
                  appointment={appointment}
                  user={user}
                  onScheduleClick={() => setShowScheduleForm(true)}
                  onConfirm={handleConfirmAppointment}
                  onCancel={handleCancelAppointment}
                  isConfirming={isConfirming}
                  isCancelling={isCancelling}
                  error={error}
                  showConfirmationSuccess={showConfirmationSuccess}
                  parseToLocalDate={parseToLocalDate}
                  formatTime={formatTime}
                  isSendingSms={isSendingSms}
                  onSendSms={handleSendSms}
                  smsError={smsError}
                  smsSuccess={smsSuccess}
                  qrCodeUrl={qrCodeUrl}
                  map={map}
                  scheduleForm={scheduleForm}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            onProfileUpdate={handleSaveProfile}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab
            appointment={appointment}
            onScheduleClick={() => setShowScheduleForm(true)}
            onConfirm={handleConfirmAppointment}
            onCancel={handleCancelAppointment}
            isConfirming={isConfirming}
            isCancelling={isCancelling}
            error={error}
            parseToLocalDate={parseToLocalDate}
            formatTime={formatTime}
            showScheduleForm={showScheduleForm}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            onSubmitSchedule={handleScheduleAppointment}
            onCloseSchedule={() => setShowScheduleForm(false)}
            isScheduling={isScheduling}
            isDayOff={isDayOff}
            availableSlots={availableSlots}
            hubConfigs={hubConfigs}
            user={user}
          />
        )}
      </main>

      {/* Modals */}
      <ScheduleAppointmentModal
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        onSubmit={handleScheduleAppointment}
        isScheduling={isScheduling}
        error={error}
        isDayOff={isDayOff}
        availableSlots={availableSlots}
        user={user}
        hubConfigs={hubConfigs}
      />

      <AddressEditModal
        isOpen={isEditingAddress}
        onClose={() => setIsEditingAddress(false)}
        onSubmit={handleUpdateAddress}
        user={user}
        isUpdating={isUpdatingAddress}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
} 