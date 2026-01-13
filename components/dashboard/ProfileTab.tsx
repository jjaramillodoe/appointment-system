'use client';

import { useState, useEffect } from 'react';
import { UserCircle, Edit, XCircle, Save } from 'lucide-react';
import { format } from 'date-fns';

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
}

interface ProfileTabProps {
  user: User;
  onProfileUpdate: (updatedProfile: any) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export default function ProfileTab({ user, onProfileUpdate, showSuccess, showError }: ProfileTabProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Profile Information
            </h2>
          </div>
          <button
            onClick={() => isEditingProfile ? handleCancelProfileEdit() : setIsEditingProfile(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            {isEditingProfile ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditingProfile ? (
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={profileForm.middleName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, middleName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.middleName || 'N/A'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditingProfile ? (
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditingProfile ? (
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {isEditingProfile ? (
              <input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            {isEditingProfile ? (
              <input
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">
                {user.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMMM dd, yyyy') : 'N/A'}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            {isEditingProfile ? (
              <select
                value={profileForm.sex}
                onChange={(e) => setProfileForm(prev => ({ ...prev, sex: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <p className="text-gray-900 py-2">{user.sex}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
            {isEditingProfile ? (
              <select
                value={profileForm.heardFrom}
                onChange={(e) => setProfileForm(prev => ({ ...prev, heardFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select option</option>
                <option value="Google">Google</option>
                <option value="Facebook">Facebook</option>
                <option value="Friend/Family">Friend/Family</option>
                <option value="Community Center">Community Center</option>
                <option value="School">School</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900 py-2">{user.heardFrom}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
            {isEditingProfile ? (
              <select
                value={profileForm.preferredLanguage}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select language</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Arabic">Arabic</option>
                <option value="Chinese">Chinese</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900 py-2">{user.preferredLanguage}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Languages</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={profileForm.additionalLanguages.join(', ')}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  additionalLanguages: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                }))}
                placeholder="Enter languages separated by commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.additionalLanguages?.join(', ') || 'None'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
            {isEditingProfile ? (
              <select
                value={profileForm.educationLevel}
                onChange={(e) => setProfileForm(prev => ({ ...prev, educationLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select education level</option>
                <option value="no-hs">No High School</option>
                <option value="some-hs">Some High School</option>
                <option value="ged">GED</option>
                <option value="hs-diploma">High School Diploma</option>
                <option value="some-college">Some College</option>
                <option value="college-degree">College Degree</option>
              </select>
            ) : (
              <p className="text-gray-900 py-2">{user.educationLevel}</p>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
              {isEditingProfile ? (
                <select
                  value={profileForm.employmentStatus}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, employmentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select employment status</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{user.employmentStatus}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.employerName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, employerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.employerName || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.jobTitle}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.jobTitle || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
          
          {/* Current/Mailing Address */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Current/Mailing Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {isEditingProfile ? (
                  <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditingProfile ? (
                  <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditingProfile ? (
                  <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditingProfile ? (
                  <input
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
            <h4 className="text-md font-medium text-gray-800 mb-3">Home Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.homeAddress.street}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.street || user.address?.street || 'Same as current address'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.homeAddress.city}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.city || user.address?.city || 'Same as current'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.homeAddress.state}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.state || user.address?.state || 'Same as current'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.homeAddress.zipCode}
                    onChange={(e) => setProfileForm(prev => ({ 
                      ...prev, 
                      homeAddress: { ...prev.homeAddress, zipCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user.homeAddress?.zipCode || user.address?.zipCode || 'Same as current'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.emergencyContact.name}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.emergencyContact?.name || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              {isEditingProfile ? (
                <select
                  value={profileForm.emergencyContact.relationship}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{user.emergencyContact?.relationship || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              {isEditingProfile ? (
                <input
                  type="tel"
                  value={profileForm.emergencyContact.phone}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.emergencyContact?.phone || 'N/A'}</p>
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
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 