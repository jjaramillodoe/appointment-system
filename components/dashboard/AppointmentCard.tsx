'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  Info,
  MapPin,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { HUBS, findHubByName, type Hub } from '@/utils/hubMatching';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { appointmentStatusLabel, isPendingProfile } from '@/lib/appointmentStatus';
import MarkdownContent from '@/components/MarkdownContent';

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'pending_profile' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
  notes: string;
  intakeType: string;
  hubName?: string;
  hubId?: string;
  hubLocation?: string;
  publicTransitDirections?: string;
}

interface User {
  closestHub?: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface AppointmentCardProps {
  appointment: Appointment | null;
  user: User;
  onScheduleClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReschedule?: () => void;
  onCompleteProfile?: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  error: string;
  showConfirmationSuccess: boolean;
  parseToLocalDate: (dateValue: any) => Date | null;
  formatTime: (time: string | undefined) => string;
  isSendingSms?: boolean;
  onSendSms?: () => void;
  smsError?: string;
  smsSuccess?: boolean;
  qrCodeUrl?: string | null;
  scheduleForm: any;
}

export default function AppointmentCard({
  appointment,
  user,
  onScheduleClick,
  onConfirm,
  onCancel,
  onReschedule,
  onCompleteProfile,
  isConfirming,
  isCancelling,
  error,
  showConfirmationSuccess,
  parseToLocalDate,
  formatTime,
  isSendingSms,
  onSendSms,
  smsError,
  smsSuccess,
  qrCodeUrl,
  scheduleForm
}: AppointmentCardProps) {
  const [hubName, setHubName] = useState<string>('');
  const [resolvedHub, setResolvedHub] = useState<Hub | null>(null);
  const [publicTransitDirections, setPublicTransitDirections] = useState<string>('');
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const resolveHub = (): Hub | null => {
    const lookupName = appointment?.hubName || user?.closestHub?.name || scheduleForm?.selectedHub;
    const matched = findHubByName(lookupName);
    if (matched) return matched;

    if (
      user?.closestHub?.latitude != null &&
      user?.closestHub?.longitude != null
    ) {
      return {
        name: user.closestHub.name,
        address: user.closestHub.address,
        latitude: user.closestHub.latitude,
        longitude: user.closestHub.longitude,
      };
    }

    return null;
  };

  useEffect(() => {
    const hub = resolveHub();
    if (!hub) return;
    setHubName(appointment?.hubName || hub.name);
    setResolvedHub(hub);
    setPublicTransitDirections(
      appointment?.publicTransitDirections || hub.publicTransitDirections || ''
    );
  }, [appointment?.hubName, appointment?.publicTransitDirections, user?.closestHub?.name, scheduleForm?.selectedHub]);

  useEffect(() => {
    if (!appointment || !mapContainer || !resolvedHub) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    mapContainer.replaceChildren();

    const mapInstance = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [resolvedHub.longitude, resolvedHub.latitude],
      zoom: 13,
    });

    mapInstance.on('load', () => {
      mapInstance.resize();
    });

    new mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([resolvedHub.longitude, resolvedHub.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${resolvedHub.name}</strong><br/>${resolvedHub.address}`))
      .addTo(mapInstance);

    mapRef.current = mapInstance;

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [appointment?._id, mapContainer, resolvedHub?.name, resolvedHub?.latitude, resolvedHub?.longitude]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'pending_profile':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Your Appointment
            </h2>
          </div>
          {!appointment && (
            <button
              onClick={onScheduleClick}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Schedule Appointment
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showConfirmationSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Appointment confirmed successfully! The learning center has been notified.
            </div>
          </div>
        )}

        {appointment ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-lg font-medium text-gray-900">
                    Adult Education Intake
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(appointment.status)}`}>
                  {getStatusIcon(appointment.status)}
                  <span className="ml-1">{appointmentStatusLabel(appointment.status)}</span>
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <span className="text-sm text-gray-500">Date</span>
                    <p className="text-gray-900 font-medium">
                      {(() => { 
                        const d = appointment && appointment.appointmentDate ? parseToLocalDate(appointment.appointmentDate) : null; 
                        return d ? format(d, 'EEEE, MMMM dd, yyyy') : 'N/A'; 
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-3" />
                  <div>
                    <span className="text-sm text-gray-500">Time</span>
                    <p className="text-gray-900 font-medium">
                      {appointment?.appointmentTime ? formatTime(appointment.appointmentTime) : 'Time not available'}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Notes</span>
                  <p className="text-gray-900 mt-1">{appointment.notes}</p>
                </div>
              )}

              {isPendingProfile(appointment.status) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Action Required: Complete Your Profile
                      </h4>
                      <p className="text-sm text-yellow-700">
                        This appointment is reserved but unconfirmed. Complete your student profile to confirm your registration.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {appointment.status === 'pending' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Action Required: Confirm Your Appointment
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Please confirm your appointment to let the learning center know you will attend. 
                        This helps ensure proper preparation and reduces wait times.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {appointment.status !== 'cancelled' && (
                <div className="mt-6 flex space-x-3">
                  {isPendingProfile(appointment.status) && onCompleteProfile && (
                    <button
                      onClick={onCompleteProfile}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                    >
                      Complete Profile to Confirm
                    </button>
                  )}
                  {appointment.status === 'pending' && (
                    <button
                      onClick={onConfirm}
                      disabled={isConfirming}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isConfirming ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 inline" />
                          Confirm Appointment
                        </>
                      )}
                    </button>
                  )}
                  {onReschedule && (
                    <button
                      onClick={onReschedule}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Reschedule
                    </button>
                  )}
                  <button
                    onClick={onCancel}
                    disabled={isCancelling}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2 inline" />
                        Cancel Appointment
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Public Transit Directions */}
              {appointment && publicTransitDirections && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center mb-3">
                    <MapPin className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Public Transit Directions</h4>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <MarkdownContent>{publicTransitDirections}</MarkdownContent>
                  </div>
                </div>
              )}

              {/* Map Section */}
              {appointment && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center mb-3">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">Location</h4>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">
                        Your appointment is scheduled at: <strong>{hubName || user?.closestHub?.name || 'Selected Learning Center'}</strong>
                      </p>
                      {(() => {
                        const selectedHub = resolvedHub || findHubByName(appointment.hubName || user?.closestHub?.name);
                        if (!selectedHub || !user.address?.street) return null;

                        const userAddress = `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}`;
                        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(userAddress)}&destination=${encodeURIComponent(selectedHub.address)}`;

                        return (
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Navigation className="h-4 w-4 mr-1.5" />
                            Get Directions
                          </a>
                        );
                      })()}
                    </div>
                    <div
                      ref={setMapContainer}
                      id="appointment-map"
                      className="w-full h-64 rounded-lg overflow-hidden border border-gray-300 bg-gray-200"
                      style={{ minHeight: '256px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointment Scheduled</h3>
            <p className="text-gray-600 mb-6 text-center">Schedule your adult education intake appointment to get started.</p>
            <button
              onClick={onScheduleClick}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Schedule Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 