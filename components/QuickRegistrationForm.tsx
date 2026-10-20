'use client';

import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import LanguageAutocomplete from './ui/LanguageAutocomplete';
import Link from 'next/link';
import { validateEmail } from '@/utils/emailValidation';

function passwordRules(password: string) {
  return [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'An uppercase and a lowercase letter', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'At least one number', met: /\d/.test(password) },
  ];
}

interface QuickRegistrationFormProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
}

interface QuickRegistrationForm {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  preferredLanguage: string;
}

interface FormErrors {
  [key: string]: string;
}

const LANGUAGE_OPTIONS = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Spanish' },
  { code: 'Chinese', name: 'Chinese' },
  { code: 'Arabic', name: 'Arabic' },
  { code: 'Bengali', name: 'Bengali' },
  { code: 'French', name: 'French' },
  { code: 'Russian', name: 'Russian' },
  { code: 'Other', name: 'Other' },
];

const initialForm: QuickRegistrationForm = {
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  preferredLanguage: '',
};

export default function QuickRegistrationForm({ onSuccess, onError }: QuickRegistrationFormProps) {
  const [form, setForm] = useState<QuickRegistrationForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [emailTaken, setEmailTaken] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const validation = validateEmail(form.email);
      if (!validation.isValid) {
        newErrors.email = validation.error || 'Invalid email format';
        setEmailSuggestions(validation.suggestions || []);
      }
    }

    // Confirm email
    if (form.email !== form.confirmEmail) {
      newErrors.confirmEmail = 'Emails do not match';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (form.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (form.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Phone validation
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits (e.g., 2125551234)';
    }

    // Language validation
    if (!form.preferredLanguage) {
      newErrors.preferredLanguage = 'Please select your preferred language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'email') setEmailTaken(false);
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleLanguageChange = (selectedLanguage: string) => {
    setForm((prev) => ({
      ...prev,
      preferredLanguage: selectedLanguage,
    }));
    if (errors.preferredLanguage) {
      setErrors((prev) => ({
        ...prev,
        preferredLanguage: '',
      }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setForm((prev) => ({
      ...prev,
      phone: formatted,
    }));
    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      onError('Please fix the errors above');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register-quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.replace(/\D/g, ''),
          preferredLanguage: form.preferredLanguage,
          registrationSource: 'quick',
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setEmailTaken(true);
        setErrors((prev) => ({ ...prev, email: 'This email already has an account.' }));
        onError('This email already has an account. Sign in instead, or reset your password.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onSuccess(data.user);
    } catch (err: any) {
      onError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 &&
    form.email && form.password && form.firstName && form.lastName && form.phone && form.preferredLanguage;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Section */}
      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-primary-900">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-colors ${
                errors.email
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && (
            <div className="mt-1.5 flex items-start gap-2" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span className="text-sm text-red-600">
                {errors.email}
                {emailTaken && (
                  <>
                    {' '}
                    <Link href="/login" className="font-semibold underline">Sign in</Link>
                    {' or '}
                    <Link href="/forgot-password" className="font-semibold underline">reset your password</Link>.
                  </>
                )}
              </span>
            </div>
          )}
          {emailSuggestions.length > 0 && (
            <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50/50 p-2.5">
              <p className="text-xs font-semibold text-yellow-800 mb-1">Suggestions:</p>
              {emailSuggestions.map((suggestion) => (
                <p key={suggestion} className="text-xs text-yellow-700">{suggestion}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmEmail" className="block text-sm font-semibold text-primary-900">
            Confirm Email <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type="email"
              id="confirmEmail"
              name="confirmEmail"
              value={form.confirmEmail}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-colors ${
                errors.confirmEmail
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="your@email.com"
            />
          </div>
          {errors.confirmEmail && (
            <div className="mt-1.5 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span className="text-sm text-red-600">{errors.confirmEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Name Section */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-primary-900">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-colors ${
                errors.firstName
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="John"
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-primary-900">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-colors ${
                errors.lastName
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="Doe"
            />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Phone Section */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-primary-900">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1.5">
          <Phone className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handlePhoneChange}
            className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-colors ${
              errors.phone
                ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
            } focus:outline-none focus:ring-2`}
            placeholder="(212) 555-1234"
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Language Section */}
      <div>
        <label className="block text-sm font-semibold text-primary-900">
          Preferred Language <span className="text-red-500">*</span>
        </label>
        <div className="mt-1.5">
          <LanguageAutocomplete
            options={LANGUAGE_OPTIONS}
            value={form.preferredLanguage}
            onChange={handleLanguageChange}
            placeholder="Select your preferred language"
          />
        </div>
        {errors.preferredLanguage && (
          <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage}</p>
        )}
      </div>

      {/* Password Section */}
      <div className="space-y-3 border-t border-primary-100 pt-5">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-primary-900">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              autoComplete="new-password"
              aria-describedby="password-rules"
              value={form.password}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-11 py-2.5 text-sm transition-colors ${
                errors.password
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-3 text-primary-400 hover:text-primary-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          <ul id="password-rules" className="mt-2 space-y-1" aria-live="polite">
            {passwordRules(form.password).map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-xs ${rule.met ? 'text-green-700' : 'text-primary-900/60'}`}
              >
                {rule.met ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <span className="inline-block h-3.5 w-3.5 rounded-full border border-current" aria-hidden />
                )}
                <span>
                  {rule.label}
                  <span className="sr-only">{rule.met ? ' (done)' : ' (not yet)'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-primary-900">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleInputChange}
              className={`w-full rounded-lg border pl-10 pr-11 py-2.5 text-sm transition-colors ${
                errors.confirmPassword
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
                  : 'border-primary-200 bg-white focus:border-primary-400 focus:ring-primary-100'
              } focus:outline-none focus:ring-2`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-3 text-primary-400 hover:text-primary-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="w-full rounded-lg bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:from-primary-600 hover:to-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account & Continue to Appointments'
        )}
      </button>

      <p className="text-center text-xs text-primary-600">
        After creating your account, you'll select your preferred appointment time.
      </p>
    </form>
  );
}
