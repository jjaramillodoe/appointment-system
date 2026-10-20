'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface User {
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface AddressEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addressData: AddressForm) => Promise<void>;
  user: User | null;
  isUpdating: boolean;
}

export default function AddressEditModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user, 
  isUpdating 
}: AddressEditModalProps) {
  const { t } = useI18n();
  const copy = t.dashboard.addressModal;
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Initialize form when user data changes
  useEffect(() => {
    if (user?.address) {
      setAddressForm({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(addressForm);
  };

  const handleClose = () => {
    // Reset form to original values
    if (user?.address) {
      setAddressForm({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || ''
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 id="address-modal-title" className="text-lg font-semibold text-gray-900">{copy.title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t.dashboard.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">{copy.intro}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address-street" className="block text-sm font-medium text-gray-700 mb-1">
                {copy.street}
              </label>
              <input
                id="address-street"
                autoComplete="street-address"
                type="text"
                value={addressForm.street}
                onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="address-city" className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.city}
                </label>
                <input
                  id="address-city"
                  autoComplete="address-level2"
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="address-state" className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.state}
                </label>
                <input
                  id="address-state"
                  autoComplete="address-level1"
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="address-zip" className="block text-sm font-medium text-gray-700 mb-1">
                {copy.zip}
              </label>
              <input
                id="address-zip"
                autoComplete="postal-code"
                inputMode="numeric"
                type="text"
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.dashboard.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isUpdating ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 