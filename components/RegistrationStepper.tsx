import { useState } from 'react';
import { User, Mail, Phone, Calendar as CalendarIcon, MapPin, GraduationCap, Briefcase, School, BookOpen, Lock, Info, CheckCircle, AlertCircle, MapPin as MapPinIcon, Loader2, Home } from 'lucide-react';
import Tooltip from './Tooltip';
import LanguageAutocomplete from './ui/LanguageAutocomplete';
import { languages } from '@/constants/languages';
import { validateEmail, getEmailSuggestions } from '@/utils/emailValidation';
import { validateDateOfBirth, formatAge, getMinimumBirthDate } from '@/utils/dateValidation';
import { findClosestHubForAddress, HubMatch } from '@/utils/hubMatching';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  sex: string;
  preferredLanguage: string;
  additionalLanguages: string[];
  heardFrom: string;
  barriersToLearning: string[];
  homeAddress: Address;
  address: Address;
  educationLevel: string;
  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  schoolInterest: string;
  programInterests: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  closestHub?: HubMatch;
}

interface RegistrationErrors {
  [key: string]: string;
}

const steps = [
  { label: 'Personal Info', icon: User },
  { label: 'Additional Info', icon: Info },
  { label: 'Home Address', icon: Home },
  { label: 'Closest Address', icon: MapPin },
  { label: 'Education', icon: GraduationCap },
  { label: 'School & Program', icon: School },
  { label: 'Account', icon: Lock },
];

const educationLevels = [
  'No formal schooling',
  'Some middle school or junior high',
  'Some high school, no diploma',
  'Previously enrolled in GED or adult education program',
  'Completed GED',
  'Completed high school diploma (traditional)',
  'Vocational/technical certificate',
  'Other / Prefer not to say',
];

const employmentStatuses = [
  'Employed',
  'Self-employed',
  'Unemployed',
  'Unemployed and looking for work',
  'Unemployed and not looking for work',
  'Student (full-time)',
  'Student (part-time)',
  'Student (not applicable)',
  'Retired',
  'Disabled',
  'Homemaker',
  'In the military',
  'In prison',
  'In a correctional facility',
  'Other / Prefer not to say',
];
const schools = [
  'School 1', 'School 2', 'School 3', 'School 4', 'School 5', 'School 6', 'School 8',
];
const programs = [
  'Adult Basic Education',
  'ESL',
  'CTE',
];

const initialForm: RegistrationForm = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  sex: '',
  preferredLanguage: '',
  additionalLanguages: [],
  heardFrom: '',
  barriersToLearning: [],
  homeAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
  educationLevel: '',
  employmentStatus: '',
  employerName: '',
  jobTitle: '',
  schoolInterest: '',
  programInterests: [],
  emergencyContact: {
    name: '',
    relationship: '',
    phone: '',
  },
};

const heardFromOptions = [
  { code: 'Google', name: 'Google' },
  { code: 'Facebook', name: 'Facebook' },
  { code: 'Friend', name: 'Friend' },
  { code: 'Community Center', name: 'Community Center' },
  { code: 'School', name: 'School' },
  { code: 'Advertisement', name: 'Advertisement' },
  { code: "Magazine", name: "Magazine" },
  { code: "Newspaper", name: "Newspaper" },
  { code: "Radio", name: "Radio" },
  { code: "TV", name: "TV" },
  { code: "Other", name: "Other" }
];
  
function validate(form: RegistrationForm, step: number): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (step === 0) {
    if (!form.firstName) errors.firstName = 'First name is required';
    if (!form.lastName) errors.lastName = 'Last name is required';
    
    // Enhanced email validation
    const emailValidation = validateEmail(form.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Invalid email address';
    }
    
    if (!form.phone) errors.phone = 'Phone is required';
    
    // Enhanced date of birth validation
    const dobValidation = validateDateOfBirth(form.dateOfBirth);
    if (!dobValidation.isValid) {
      errors.dateOfBirth = dobValidation.error || 'Invalid date of birth';
    }
  }
  if (step === 1) {
    if (!form.sex) errors.sex = 'Sex is required';
    if (!form.preferredLanguage) errors.preferredLanguage = 'Preferred language is required';
    if (!form.heardFrom) errors.heardFrom = 'Please let us know how you heard about us';
    if (!form.barriersToLearning.length) errors.barriersToLearning = 'Please select at least one barrier to learning';
  }
  if (step === 2) {
    if (!form.homeAddress.street) errors.homeStreet = 'Home street is required';
    if (!form.homeAddress.city) errors.homeCity = 'Home city is required';
    if (!form.homeAddress.state) errors.homeState = 'Home state is required';
    if (!form.homeAddress.zipCode) errors.homeZipCode = 'Home ZIP code is required';
  }
  if (step === 3) {
    if (!form.address.street) errors.street = 'Street is required';
    if (!form.address.city) errors.city = 'City is required';
    if (!form.address.state) errors.state = 'State is required';
    if (!form.address.zipCode) errors.zipCode = 'ZIP code is required';
  }
  if (step === 4) {
    if (!form.educationLevel) errors.educationLevel = 'Education level is required';
    if (!form.employmentStatus) errors.employmentStatus = 'Employment status is required';
    if (form.employmentStatus === 'Employed' && !form.employerName) errors.employerName = 'Employer name is required when employed';
    if (form.employmentStatus === 'Employed' && !form.jobTitle) errors.jobTitle = 'Job title is required when employed';
  }
  if (step === 5) {
    if (!form.schoolInterest) errors.schoolInterest = 'School is required';
    if (!form.programInterests.length) errors.programInterests = 'Select at least one program';
    if (!form.emergencyContact.name) errors.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyContact.relationship) errors.emergencyRelationship = 'Emergency contact relationship is required';
    if (!form.emergencyContact.phone) errors.emergencyPhone = 'Emergency contact phone is required';
  }
  if (step === 6) {
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}

export default function RegistrationStepper({ onSubmit }: { onSubmit: (form: RegistrationForm) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [findingHub, setFindingHub] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    if (name.startsWith('homeAddress.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, homeAddress: { ...prev.homeAddress, [key]: value } }));
    } else if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
      
      // Auto-find closest hub when address is complete
      if (key === 'zipCode' && value.length === 5) {
        const updatedAddress = { ...form.address, [key]: value };
        const fullAddress = `${updatedAddress.street}, ${updatedAddress.city}, ${updatedAddress.state} ${value}`;
        findClosestHub(fullAddress);
      }
    } else if (name === 'programInterests') {
      setForm((prev) => ({
        ...prev,
        programInterests: checked
          ? [...prev.programInterests, value]
          : prev.programInterests.filter((p) => p !== value),
      }));
    } else if (name === 'barriersToLearning') {
      setForm((prev) => ({
        ...prev,
        barriersToLearning: checked
          ? [...prev.barriersToLearning, value]
          : prev.barriersToLearning.filter((b) => b !== value),
      }));
    } else if (name === 'additionalLanguages') {
      setForm((prev) => ({
        ...prev,
        additionalLanguages: checked
          ? [...prev.additionalLanguages, value]
          : prev.additionalLanguages.filter((lang) => lang !== value),
      }));
    } else if (name.startsWith('emergencyContact.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ 
        ...prev, 
        emergencyContact: { ...prev.emergencyContact, [key]: value } 
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const findClosestHub = async (address: string) => {
    setFindingHub(true);
    try {
      const hubMatch = await findClosestHubForAddress(address);
      if (hubMatch) {
        setForm(prev => ({ ...prev, closestHub: hubMatch }));
      }
    } catch (error) {
      console.error('Error finding closest hub:', error);
    } finally {
      setFindingHub(false);
    }
  };

  const handleNext = () => {
    const errs = validate(form, step);
    setErrors(errs);
    setTouched({});
    if (Object.keys(errs).length === 0) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, step);
    setErrors(errs);
    setTouched({});
    setSubmitError(''); // Clear any previous errors
    
    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      try {
        await onSubmit(form);
        setSuccess(true);
      } catch (error: any) {
        setSubmitting(false);
        // Handle specific error cases
        if (error.message && error.message.includes('already exists')) {
          setSubmitError('An account with this email address already exists. Please try logging in instead.');
        } else {
          setSubmitError(error.message || 'Registration failed. Please try again.');
        }
      }
    }
  };

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center bg-green-100 rounded-full p-4 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
        <p className="text-gray-700 mb-6">Your account has been created. You can now log in and schedule your appointment.</p>
      </div>
    );
  }

  return (
    <form className="max-w-4xl mx-auto card" onSubmit={handleSubmit} autoComplete="off">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center relative">
            {/* Step Icon */}
            <div className={`rounded-full p-2 z-10 relative transform transition-all duration-300 ${
              i === step 
                ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg scale-110' 
                : i < step 
                ? 'bg-gradient-to-br from-green-500 to-green-400 text-white shadow-md' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              <s.icon className="h-6 w-6" />
              {i < step && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Step Label */}
            <span className={`text-xs mt-2 z-10 relative font-medium ${
              i === step 
                ? 'text-primary-700 font-bold' 
                : i < step 
                ? 'text-green-600 font-semibold' 
                : 'text-gray-500'
            }`}>
              {s.label}
            </span>
            
            {/* Connecting Line */}
            {i < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 h-1 rounded-full transition-all duration-300 ${
                i < step 
                  ? 'bg-gradient-to-r from-green-500 via-yellow-400 to-green-500' 
                  : 'bg-gray-200'
              }`} style={{ width: 'calc(100% - 2rem)', left: 'calc(50% + 1rem)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 0 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Personal Information</h3>
                <p className="text-primary-700 text-sm">Please provide your basic personal information. This helps us create your account and contact you about your appointments.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="h-4 w-4 mr-1" /> First Name
            </label>
            <input 
              name="firstName" 
              value={form.firstName} 
              onChange={handleChange} 
              className={`input-field ${touched.firstName && errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
              required 
              aria-required="true" 
            />
            {touched.firstName && errors.firstName && <div className="text-red-600 text-xs mt-1">{errors.firstName}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="h-4 w-4 mr-1" /> Middle Name
            </label>
            <input name="middleName" value={form.middleName} onChange={handleChange} className="input-field" />
            {touched.middleName && errors.middleName && <div className="text-red-600 text-xs mt-1">{errors.middleName}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="h-4 w-4 mr-1" /> Last Name
            </label>
            <input 
              name="lastName" 
              value={form.lastName} 
              onChange={handleChange} 
              className={`input-field ${touched.lastName && errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
              required 
              aria-required="true" 
            />
            {touched.lastName && errors.lastName && <div className="text-red-600 text-xs mt-1">{errors.lastName}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Mail className="h-4 w-4 mr-1" /> Email
              <Tooltip text="We'll use this to send you appointment confirmations and updates."><Info className="h-3 w-3 ml-1 text-gray-400" /></Tooltip>
            </label>
            <input 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              className={`input-field ${touched.email && errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
              required 
              aria-required="true"
              placeholder="your.email@example.com"
            />
            {touched.email && form.email && (
              <>
                {errors.email ? (
                  <div className="text-red-600 text-xs mt-1">
                    <div className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </div>
                    {getEmailSuggestions(form.email).length > 0 && (
                      <div className="mt-1 text-primary-600">
                        {getEmailSuggestions(form.email).map((suggestion, index) => (
                          <div key={index} className="text-xs font-medium">{suggestion}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-600 text-xs mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid email address
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Phone className="h-4 w-4 mr-1" /> Phone
              <Tooltip text="Include area code. Only numbers."><Info className="h-3 w-3 ml-1 text-gray-400" /></Tooltip>
            </label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              className={`input-field ${touched.phone && errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
              required 
              aria-required="true" 
            />
            {touched.phone && errors.phone && <div className="text-red-600 text-xs mt-1">{errors.phone}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" /> Date of Birth
              <Tooltip text="You must be at least 21 years old to register."><Info className="h-3 w-3 ml-1 text-gray-400" /></Tooltip>
            </label>
            <input 
              name="dateOfBirth" 
              type="date" 
              value={form.dateOfBirth} 
              onChange={handleChange} 
              className={`input-field ${touched.dateOfBirth && errors.dateOfBirth ? 'border-red-500 focus:border-red-500' : ''}`}
              required 
              aria-required="true"
              max={getMinimumBirthDate()}
            />
            {touched.dateOfBirth && form.dateOfBirth && (
              <>
                {errors.dateOfBirth ? (
                  <div className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.dateOfBirth}
                  </div>
                ) : (
                  (() => {
                    const dobValidation = validateDateOfBirth(form.dateOfBirth);
                    if (dobValidation.isValid && dobValidation.age) {
                      return (
                        <div className="text-green-600 text-xs mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {formatAge(dobValidation.age)} - Age requirement met
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </>
            )}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Info className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Additional Information</h3>
                <p className="text-primary-700 text-sm">Help us understand your background and preferences to provide better services and support.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="h-4 w-4 mr-1" /> Sex
            </label>
            <select name="sex" value={form.sex} onChange={handleChange} className="input-field" required aria-required="true">
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {touched.sex && errors.sex && <div className="text-red-600 text-xs mt-1">{errors.sex}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <BookOpen className="h-4 w-4 mr-1" /> Preferred Language
            </label>
            <LanguageAutocomplete
              options={[...languages, { code: 'Other', name: 'Other' }]}
              value={form.preferredLanguage}
              onChange={(value) => {
                const syntheticEvent = {
                  target: { name: 'preferredLanguage', value }
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange(syntheticEvent);
              }}
              placeholder="Select or type to search language..."
              required
              className="input-field"
            />
            {touched.preferredLanguage && errors.preferredLanguage && <div className="text-red-600 text-xs mt-1">{errors.preferredLanguage}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Info className="h-4 w-4 mr-1" /> How did you hear about us?
            </label>
            <select name="heardFrom" value={form.heardFrom} onChange={handleChange} className="input-field" required aria-required="true">
              <option value="">Select how you heard about us</option>
              {heardFromOptions.sort((a, b) => a.name.localeCompare(b.name)).map((option) => (
                <option key={option.code} value={option.code}>{option.name}</option>
              ))}
            </select>
            {touched.heardFrom && errors.heardFrom && <div className="text-red-600 text-xs mt-1">{errors.heardFrom}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" /> Barriers to Learning
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="barriersToLearning"
                  value="Language"
                  checked={form.barriersToLearning.includes('Language')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Language</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="barriersToLearning"
                  value="Literacy"
                  checked={form.barriersToLearning.includes('Literacy')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Literacy</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="barriersToLearning"
                  value="Technology"
                  checked={form.barriersToLearning.includes('Technology')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Technology</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="barriersToLearning"
                  value="Transportation"
                  checked={form.barriersToLearning.includes('Transportation')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Transportation</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="barriersToLearning"
                  value="Other"
                  checked={form.barriersToLearning.includes('Other')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Other</span>
              </label>
            </div>
            {touched.barriersToLearning && errors.barriersToLearning && <div className="text-red-600 text-xs mt-1">{errors.barriersToLearning}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Info className="h-4 w-4 mr-1" /> Additional Languages (if any)
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="additionalLanguages"
                  value="English"
                  checked={form.additionalLanguages.includes('English')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>English</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="additionalLanguages"
                  value="Spanish"
                  checked={form.additionalLanguages.includes('Spanish')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Spanish</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="additionalLanguages"
                  value="French"
                  checked={form.additionalLanguages.includes('French')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>French</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="additionalLanguages"
                  value="Other"
                  checked={form.additionalLanguages.includes('Other')}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span>Other</span>
              </label>
            </div>
            {touched.additionalLanguages && errors.additionalLanguages && <div className="text-red-600 text-xs mt-1">{errors.additionalLanguages}</div>}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Home Address</h3>
                <p className="text-primary-700 text-sm">Please provide your current home address. This helps us understand your location and provide appropriate services.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Home className="h-4 w-4 mr-1" /> Home Street Address
            </label>
            <input name="homeAddress.street" value={form.homeAddress.street} onChange={handleChange} className="input-field" required aria-required="true" />
            {touched.homeStreet && errors.homeStreet && <div className="text-red-600 text-xs mt-1">{errors.homeStreet}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Home className="h-4 w-4 mr-1" /> Home City
            </label>
            <input name="homeAddress.city" value={form.homeAddress.city} onChange={handleChange} className="input-field" required aria-required="true" />
            {touched.homeCity && errors.homeCity && <div className="text-red-600 text-xs mt-1">{errors.homeCity}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Home className="h-4 w-4 mr-1" /> Home State
            </label>
            <input name="homeAddress.state" value={form.homeAddress.state} onChange={handleChange} className="input-field" required aria-required="true" />
            {touched.homeState && errors.homeState && <div className="text-red-600 text-xs mt-1">{errors.homeState}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Home className="h-4 w-4 mr-1" /> Home ZIP Code
            </label>
            <input name="homeAddress.zipCode" value={form.homeAddress.zipCode} onChange={handleChange} className="input-field" required aria-required="true" />
            {touched.homeZipCode && errors.homeZipCode && <div className="text-red-600 text-xs mt-1">{errors.homeZipCode}</div>}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Closest Address</h3>
                <p className="text-primary-700 text-sm">Please provide the address closest to where you'd like to attend classes. This helps us find the nearest learning center for you. If it's the same as your home address, you can copy the information from the previous step.</p>
              </div>
            </div>
          </div>

          {/* Same as Home Address Checkbox */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.address.street === form.homeAddress.street && 
                         form.address.city === form.homeAddress.city && 
                         form.address.state === form.homeAddress.state && 
                         form.address.zipCode === form.homeAddress.zipCode}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm(prev => {
                      const newAddress = {
                        street: prev.homeAddress.street,
                        city: prev.homeAddress.city,
                        state: prev.homeAddress.state,
                        zipCode: prev.homeAddress.zipCode,
                      };
                      
                      // Find closest hub when copying home address
                      const fullAddress = `${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zipCode}`;
                      if (newAddress.street && newAddress.city && newAddress.state && newAddress.zipCode) {
                        findClosestHub(fullAddress);
                      }
                      
                      return {
                        ...prev,
                        address: newAddress
                      };
                    });
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Same as home address</span>
                <p className="text-xs text-gray-500 mt-1">Check this box to automatically copy your home address information</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> Street Address
            </label>
            <input name="address.street" value={form.address.street} onChange={handleChange} className="input-field" required aria-required="true" placeholder="Enter street address" />
            {touched.street && errors.street && <div className="text-red-600 text-xs mt-1">{errors.street}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> City
            </label>
            <input name="address.city" value={form.address.city} onChange={handleChange} className="input-field" required aria-required="true" placeholder="Enter city" />
            {touched.city && errors.city && <div className="text-red-600 text-xs mt-1">{errors.city}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> State
            </label>
            <input name="address.state" value={form.address.state} onChange={handleChange} className="input-field" required aria-required="true" placeholder="Enter state (e.g., NY, CA)" />
            {touched.state && errors.state && <div className="text-red-600 text-xs mt-1">{errors.state}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> ZIP Code
            </label>
            <input name="address.zipCode" value={form.address.zipCode} onChange={handleChange} className="input-field" required aria-required="true" placeholder="Enter 5-digit ZIP code" />
            {touched.zipCode && errors.zipCode && <div className="text-red-600 text-xs mt-1">{errors.zipCode}</div>}
          </div>
          
          {/* Manual Find Closest Hub Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                const fullAddress = `${form.address.street}, ${form.address.city}, ${form.address.state} ${form.address.zipCode}`;
                if (form.address.street && form.address.city && form.address.state && form.address.zipCode) {
                  findClosestHub(fullAddress);
                }
              }}
              disabled={!form.address.street || !form.address.city || !form.address.state || !form.address.zipCode || findingHub}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapPinIcon className="h-4 w-4" />
              <span>{findingHub ? 'Finding...' : 'Find Closest Learning Center'}</span>
            </button>
          </div>
          
          {/* Closest Hub Display */}
          {findingHub && (
            <div className="bg-gradient-to-r from-primary-50 to-yellow-50 border-2 border-primary-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                </div>
                <span className="ml-3 text-primary-800 text-sm font-medium">Finding your closest learning center...</span>
              </div>
            </div>
          )}
          
          {form.closestHub && !findingHub && (
            <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-green-50 border-2 border-green-300 rounded-xl p-4 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPinIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="font-bold text-green-900 mb-2 flex items-center">
                    Recommended Learning Center
                    <CheckCircle className="h-4 w-4 ml-2 text-yellow-600" />
                  </h4>
                  <p className="text-green-800 font-semibold mb-1">{form.closestHub.hub.name}</p>
                  <p className="text-green-700 text-sm mb-2">{form.closestHub.hub.address}</p>
                  <p className="text-green-700 text-xs font-medium">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 mr-2">
                      Distance
                    </span>
                    {form.closestHub.distanceText} from your address
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Education & Employment</h3>
                <p className="text-primary-700 text-sm">Tell us about your educational background and current employment status to help us tailor our services to your needs.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <GraduationCap className="h-4 w-4 mr-1" /> Education Level
            </label>
            <select name="educationLevel" value={form.educationLevel} onChange={handleChange} className="input-field" required aria-required="true">
              <option value="">Select education level</option>
              {/* sort by name */}
              {educationLevels.sort((a, b) => a.localeCompare(b)).map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {touched.educationLevel && errors.educationLevel && <div className="text-red-600 text-xs mt-1">{errors.educationLevel}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Briefcase className="h-4 w-4 mr-1" /> Employment Status
            </label>
            <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange} className="input-field" required aria-required="true">
              <option value="">Select employment status</option>
              {/* sort by name */}
              {employmentStatuses.sort((a, b) => a.localeCompare(b)).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            {touched.employmentStatus && errors.employmentStatus && <div className="text-red-600 text-xs mt-1">{errors.employmentStatus}</div>}
          </div>
          {form.employmentStatus === 'Employed' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" /> Employer Name
                </label>
                <input name="employerName" value={form.employerName} onChange={handleChange} className="input-field" required aria-required="true" />
                {touched.employerName && errors.employerName && <div className="text-red-600 text-xs mt-1">{errors.employerName}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" /> Job Title
                </label>
                <input name="jobTitle" value={form.jobTitle} onChange={handleChange} className="input-field" required aria-required="true" />
                {touched.jobTitle && errors.jobTitle && <div className="text-red-600 text-xs mt-1">{errors.jobTitle}</div>}
              </div>
            </>
          )}
        </div>
      )}
      {step === 5 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <School className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">School & Program Selection</h3>
                <p className="text-primary-700 text-sm">Choose your preferred school and the programs you're interested in. This helps us match you with the right educational opportunities.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <School className="h-4 w-4 mr-1" /> School Interest
            </label>
            <select name="schoolInterest" value={form.schoolInterest} onChange={handleChange} className="input-field" required aria-required="true">
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
            {touched.schoolInterest && errors.schoolInterest && <div className="text-red-600 text-xs mt-1">{errors.schoolInterest}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <BookOpen className="h-4 w-4 mr-1" /> Program Interests
              <Tooltip text="Select all that apply."><Info className="h-3 w-3 ml-1 text-gray-400" /></Tooltip>
            </label>
            <div className="flex flex-wrap gap-4">
              {programs.map((prog) => (
                <label key={prog} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="programInterests"
                    value={prog}
                    checked={form.programInterests.includes(prog)}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>{prog}</span>
                </label>
              ))}
            </div>
            {touched.programInterests && errors.programInterests && <div className="text-red-600 text-xs mt-1">{errors.programInterests}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Info className="h-4 w-4 mr-1" /> Emergency Contact
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="emergencyContact.name" value={form.emergencyContact.name} onChange={handleChange} className="input-field" />
                {touched.emergencyName && errors.emergencyName && <div className="text-red-600 text-xs mt-1">{errors.emergencyName}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input name="emergencyContact.relationship" value={form.emergencyContact.relationship} onChange={handleChange} className="input-field" />
                {touched.emergencyRelationship && errors.emergencyRelationship && <div className="text-red-600 text-xs mt-1">{errors.emergencyRelationship}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="emergencyContact.phone" value={form.emergencyContact.phone} onChange={handleChange} className="input-field" />
                {touched.emergencyPhone && errors.emergencyPhone && <div className="text-red-600 text-xs mt-1">{errors.emergencyPhone}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
      {step === 6 && (
        <div className="space-y-4">
          {/* Step Description */}
          <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="font-bold text-primary-900 mb-1">Create Your Account</h3>
                <p className="text-primary-700 text-sm">Set up your secure password to complete your registration. You'll use this to log in and access your account.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Lock className="h-4 w-4 mr-1" /> Password
              <Tooltip text="At least 6 characters."><Info className="h-3 w-3 ml-1 text-gray-400" /></Tooltip>
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" required aria-required="true" minLength={6} />
            {touched.password && errors.password && <div className="text-red-600 text-xs mt-1">{errors.password}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Lock className="h-4 w-4 mr-1" /> Confirm Password
            </label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" required aria-required="true" />
            {touched.confirmPassword && errors.confirmPassword && <div className="text-red-600 text-xs mt-1">{errors.confirmPassword}</div>}
          </div>
        </div>
      )}

      {/* Submit Error Display */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Registration Error</h4>
              <p className="text-red-700 text-sm">{submitError}</p>
              {submitError.includes('already exists') && (
                <div className="mt-3">
                  <a 
                    href="/login" 
                    className="text-red-600 hover:text-red-800 underline text-sm font-medium"
                  >
                    Go to Login Page
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8">
        {step > 0 && (
          <button type="button" onClick={handleBack} className="btn-secondary">
            Back
          </button>
        )}
        {step < steps.length - 1 && (
          <button type="button" onClick={handleNext} className="btn-primary ml-auto">
            Next
          </button>
        )}
        {step === steps.length - 1 && (
          <button type="submit" disabled={submitting} className="btn-primary ml-auto">
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        )}
      </div>
    </form>
  );
} 