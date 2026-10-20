'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { UserCircle, Edit, XCircle, Save } from 'lucide-react';
import { format } from 'date-fns';
import ProfileCompletionDashboard from './ProfileCompletionDashboard';
import { useI18n } from '@/contexts/I18nContext';
import { dateFnsLocale, optionLabel } from '@/lib/i18n/labels';

interface User {
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
}

interface ProfileTabProps {
  user: User;
  onProfileUpdate: (updatedProfile: any) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export default function ProfileTab({ user, onProfileUpdate, showSuccess, showError }: ProfileTabProps) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.profile;
  const common = t.dashboard.common;
  const options = copy.options;
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [schoolNames, setSchoolNames] = useState<string[]>([]);

  // Real school list (the form used to offer placeholder "School 1–8")
  useEffect(() => {
    fetch('/api/schools')
      .then((res) => (res.ok ? res.json() : { schools: [] }))
      .then((data) => setSchoolNames((data.schools || []).map((school: { name: string }) => school.name)))
      .catch(() => setSchoolNames([]));
  }, []);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
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

  // Populate profile form when user data is loaded
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
    }
  }, [user]);

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
        onProfileUpdate(data.user);
        setIsEditingProfile(false);
        showSuccess(copy.updated);
      } else {
        const errorData = await response.json();
        showError(errorData.error || copy.updateFailed);
      }
    } catch (error) {
      logger.error('Profile update error:', error);
      showError(copy.updateFailed);
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

  const handleEditSection = (section: string) => {
    setIsEditingProfile(true);
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Dashboard */}
      <ProfileCompletionDashboard
        user={user}
        onEditSection={handleEditSection}
      />

      {/* Profile Form Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {copy.title}
              </h2>
            </div>
          <button
            onClick={() => isEditingProfile ? handleCancelProfileEdit() : setIsEditingProfile(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            {isEditingProfile ? (
              <>
                <XCircle className="h-4 w-4 mr-2" aria-hidden />
                {common.cancel}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" aria-hidden />
                {copy.edit}
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="profile-first-name" className="block text-sm font-medium text-gray-700 mb-1">{copy.firstName}</label>
            {isEditingProfile ? (
              <input id="profile-first-name"
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.firstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-middle-name" className="block text-sm font-medium text-gray-700 mb-1">{copy.middleName}</label>
            {isEditingProfile ? (
              <input id="profile-middle-name"
                type="text"
                value={profileForm.middleName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, middleName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.middleName || common.notAvailable}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-last-name" className="block text-sm font-medium text-gray-700 mb-1">{copy.lastName}</label>
            {isEditingProfile ? (
              <input id="profile-last-name"
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.lastName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">{copy.email}</label>
            {isEditingProfile ? (
              <input id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">{copy.phone}</label>
            {isEditingProfile ? (
              <input id="profile-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.phone}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-dob" className="block text-sm font-medium text-gray-700 mb-1">{copy.dateOfBirth}</label>
            {isEditingProfile ? (
              <input id="profile-dob"
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">
                {user.dateOfBirth ? format(new Date(user.dateOfBirth), 'PPP', { locale: dateFnsLocale(locale) }) : common.notAvailable}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-gender" className="block text-sm font-medium text-gray-700 mb-1">{copy.gender}</label>
            {isEditingProfile ? (
              <select id="profile-gender"
                value={profileForm.sex}
                onChange={(e) => setProfileForm(prev => ({ ...prev, sex: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{copy.selectGender}</option>
                {Object.entries(options.sex).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 py-2">{optionLabel(options.sex, user.sex)}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-heard-from" className="block text-sm font-medium text-gray-700 mb-1">{copy.heardFrom}</label>
            {isEditingProfile ? (
              <select id="profile-heard-from"
                value={profileForm.heardFrom}
                onChange={(e) => setProfileForm(prev => ({ ...prev, heardFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{copy.selectOption}</option>
                {Object.entries(options.heardFrom).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 py-2">{optionLabel(options.heardFrom, user.heardFrom)}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-language" className="block text-sm font-medium text-gray-700 mb-1">{copy.primaryLanguage}</label>
            {isEditingProfile ? (
              <select id="profile-language"
                value={profileForm.preferredLanguage}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{copy.selectLanguage}</option>
                {Object.entries(options.language).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 py-2">{optionLabel(options.language, user.preferredLanguage)}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="profile-additional-languages" className="block text-sm font-medium text-gray-700 mb-1">{copy.additionalLanguages}</label>
            {isEditingProfile ? (
              <input id="profile-additional-languages"
                type="text"
                value={profileForm.additionalLanguages.join(', ')}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  additionalLanguages: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                }))}
                placeholder={copy.additionalLanguagesPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.additionalLanguages?.join(', ') || common.none}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="profile-education" className="block text-sm font-medium text-gray-700 mb-1">{copy.educationLevel}</label>
            {isEditingProfile ? (
              <select id="profile-education"
                value={profileForm.educationLevel}
                onChange={(e) => setProfileForm(prev => ({ ...prev, educationLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{copy.selectEducation}</option>
                {Object.entries(options.education).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 py-2">{optionLabel(options.education, user.educationLevel)}</p>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{copy.employmentTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="profile-employment" className="block text-sm font-medium text-gray-700 mb-1">{copy.employmentStatus}</label>
              {isEditingProfile ? (
                <select id="profile-employment"
                  value={profileForm.employmentStatus}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, employmentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{copy.selectEmployment}</option>
                  {Object.entries(options.employment).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 py-2">{optionLabel(options.employment, user.employmentStatus)}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="profile-employer" className="block text-sm font-medium text-gray-700 mb-1">{copy.employerName}</label>
              {isEditingProfile ? (
                <input id="profile-employer"
                  type="text"
                  value={profileForm.employerName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, employerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.employerName || common.notAvailable}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="profile-job-title" className="block text-sm font-medium text-gray-700 mb-1">{copy.jobTitle}</label>
              {isEditingProfile ? (
                <input id="profile-job-title"
                  type="text"
                  value={profileForm.jobTitle}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.jobTitle || common.notAvailable}</p>
              )}
            </div>
          </div>

          {/* School and Program Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-800 mb-4">{copy.schoolProgramTitle}</h4>

            {/* School Interest Dropdown */}
            <div className="mb-6">
              <label htmlFor="profile-school" className="block text-sm font-medium text-gray-700 mb-1">{copy.schoolInterest}</label>
              {isEditingProfile ? (
                <select id="profile-school"
                  value={profileForm.schoolInterest}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, schoolInterest: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{copy.selectSchool}</option>
                  {[...new Set([...schoolNames, ...(profileForm.schoolInterest ? [profileForm.schoolInterest] : [])])].map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 py-2">{user.schoolInterest || common.notSpecified}</p>
              )}
            </div>

            {/* Program Interests Checkboxes */}
            <div className="mb-6">
              <p id="profile-programs-label" className="block text-sm font-medium text-gray-700 mb-3">{copy.programInterests}</p>
              {isEditingProfile ? (
                <div className="space-y-2" role="group" aria-labelledby="profile-programs-label">
                  {['Adult Basic Education', 'ESL', 'CTE'].map(program => (
                    <label key={program} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileForm.programInterests.includes(program)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileForm(prev => ({
                              ...prev,
                              programInterests: [...prev.programInterests, program]
                            }));
                          } else {
                            setProfileForm(prev => ({
                              ...prev,
                              programInterests: prev.programInterests.filter(p => p !== program)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-gray-700">{optionLabel(options.program, program)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-900 py-2">{user.programInterests?.length ? user.programInterests.map((program) => optionLabel(options.program, program)).join(', ') : common.noneSelected}</p>
              )}
            </div>

            {/* Barriers to Learning Checkboxes */}
            <div>
              <p id="profile-barriers-label" className="block text-sm font-medium text-gray-700 mb-3">{copy.barriers}</p>
              {isEditingProfile ? (
                <div className="space-y-2" role="group" aria-labelledby="profile-barriers-label">
                  {['Language', 'Literacy', 'Technology', 'Transportation', 'Other'].map(barrier => (
                    <label key={barrier} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileForm.barriersToLearning.includes(barrier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileForm(prev => ({
                              ...prev,
                              barriersToLearning: [...prev.barriersToLearning, barrier]
                            }));
                          } else {
                            setProfileForm(prev => ({
                              ...prev,
                              barriersToLearning: prev.barriersToLearning.filter(b => b !== barrier)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-gray-700">{optionLabel(options.barrier, barrier)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-900 py-2">{user.barriersToLearning?.length ? user.barriersToLearning.map((barrier) => optionLabel(options.barrier, barrier)).join(', ') : common.noneSelected}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{copy.addressTitle}</h3>
          
          {/* Current/Mailing Address */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">{copy.currentAddress}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="profile-address-street" className="block text-sm font-medium text-gray-700 mb-1">{copy.street}</label>
                {isEditingProfile ? (
                  <input id="profile-address-street"
                    type="text"
                    value={profileForm.address.street}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.address?.street}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-address-city" className="block text-sm font-medium text-gray-700 mb-1">{copy.city}</label>
                {isEditingProfile ? (
                  <input id="profile-address-city"
                    type="text"
                    value={profileForm.address.city}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.address?.city}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-address-state" className="block text-sm font-medium text-gray-700 mb-1">{copy.state}</label>
                {isEditingProfile ? (
                  <input id="profile-address-state"
                    type="text"
                    value={profileForm.address.state}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.address?.state}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-address-zip" className="block text-sm font-medium text-gray-700 mb-1">{copy.zip}</label>
                {isEditingProfile ? (
                  <input id="profile-address-zip"
                    type="text"
                    value={profileForm.address.zipCode}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zipCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.address?.zipCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Home Address */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">{copy.homeAddress}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="profile-home-street" className="block text-sm font-medium text-gray-700 mb-1">{copy.street}</label>
                {isEditingProfile ? (
                  <input id="profile-home-street"
                    type="text"
                    value={profileForm.homeAddress.street}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.street || user.address?.street || copy.sameAsCurrent}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-home-city" className="block text-sm font-medium text-gray-700 mb-1">{copy.city}</label>
                {isEditingProfile ? (
                  <input id="profile-home-city"
                    type="text"
                    value={profileForm.homeAddress.city}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.city || user.address?.city || copy.sameAsCurrent}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-home-state" className="block text-sm font-medium text-gray-700 mb-1">{copy.state}</label>
                {isEditingProfile ? (
                  <input id="profile-home-state"
                    type="text"
                    value={profileForm.homeAddress.state}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.state || user.address?.state || copy.sameAsCurrent}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="profile-home-zip" className="block text-sm font-medium text-gray-700 mb-1">{copy.zip}</label>
                {isEditingProfile ? (
                  <input id="profile-home-zip"
                    type="text"
                    value={profileForm.homeAddress.zipCode}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, zipCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.zipCode || user.address?.zipCode || copy.sameAsCurrent}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{copy.emergencyTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="profile-emergency-name" className="block text-sm font-medium text-gray-700 mb-1">{copy.contactName}</label>
              {isEditingProfile ? (
                <input id="profile-emergency-name"
                  type="text"
                  value={profileForm.emergencyContact.name}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.emergencyContact?.name || common.notAvailable}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="profile-emergency-relationship" className="block text-sm font-medium text-gray-700 mb-1">{copy.relationship}</label>
              {isEditingProfile ? (
                <select id="profile-emergency-relationship"
                  value={profileForm.emergencyContact.relationship}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{copy.selectRelationship}</option>
                  {Object.entries(options.relationship).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 py-2">{optionLabel(options.relationship, user.emergencyContact?.relationship) || common.notAvailable}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="profile-emergency-phone" className="block text-sm font-medium text-gray-700 mb-1">{copy.contactPhone}</label>
              {isEditingProfile ? (
                <input id="profile-emergency-phone"
                  type="tel"
                  value={profileForm.emergencyContact.phone}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.emergencyContact?.phone || common.notAvailable}</p>
              )}
            </div>
          </div>
        </div>

        {isEditingProfile && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={handleCancelProfileEdit}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              {common.cancel}
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {copy.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden />
                  {copy.save}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
} 