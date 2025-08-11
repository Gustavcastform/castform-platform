'use client'

import { useState, useEffect } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import './phone-input.css';
import { Button } from '@/components/ui/button';
import type { Contact } from '@/lib/types';

interface EditContactModalProps {
  show: boolean;
  isLoading: boolean;
  onClose: () => void;
  onUpdateContact: (contactData: Contact) => void;
  contact: Contact | null;
}

export default function EditContactModal({ show, isLoading, onClose, onUpdateContact, contact }: EditContactModalProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [job, setJob] = useState('');
  const [info, setInfo] = useState('');
  const [errors, setErrors] = useState<{ email?: string; phoneNumber?: string }>({});

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhoneNumber(contact.phone_number as E164Number | undefined);
      setEmail(contact.email || '');
      
      let remainingInfo = contact.info || '';
      const optionalFields: { [key: string]: (value: string) => void } = {
        Job: setJob,
        Age: setAge,
        Gender: setGender,
        Location: setLocation,
      };

      // Reset fields before parsing
      Object.values(optionalFields).forEach(setter => setter(''));

      const lines = remainingInfo.split('\n');
      const nonOptionalLines: string[] = [];

      lines.forEach(line => {
        const match = line.match(/^(Job|Age|Gender|Location): (.*)/);
        if (match) {
          const [, key, value] = match;
          optionalFields[key]?.(value);
        } else {
          nonOptionalLines.push(line);
        }
      });

      // Reconstruct the info text, trimming any leading/trailing blank sections
      setInfo(nonOptionalLines.join('\n').trim());
      setErrors({});
    } else {
      // Clear form if no contact is selected
      setName('');
      setPhoneNumber(undefined);
      setEmail('');
      setAge('');
      setGender('');
      setLocation('');
      setJob('');
      setInfo('');
      setErrors({});
    }
  }, [contact]);

  const validate = (currentPhoneNumber = phoneNumber, currentEmail = email) => {
    const newErrors: { email?: string; phoneNumber?: string } = {};
    if (currentEmail && !/\S+@\S+\.\S+/.test(currentEmail)) {
      newErrors.email = 'Invalid email address';
    }

    if (currentPhoneNumber && !isValidPhoneNumber(currentPhoneNumber)) {
        newErrors.phoneNumber = 'Invalid phone number. Please include the country code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneNumberChange = (value: E164Number | undefined) => {
    setPhoneNumber(value);
    if (errors.phoneNumber) {
      validate(value, email);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (errors.email) {
      validate(phoneNumber, newEmail);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(phoneNumber, email) || !contact || !phoneNumber) return;

    const additionalData = [];
    if (job) additionalData.push(`Job: ${job}`);
    if (age) additionalData.push(`Age: ${age}`);
    if (gender) additionalData.push(`Gender: ${gender}`);
    if (location) additionalData.push(`Location: ${location}`);

    const additionalText = additionalData.join('\n');
    
    const combinedInfo = [info, additionalText].filter(Boolean).join('\n\n');

    onUpdateContact({
      ...contact,
      name,
      phone_number: phoneNumber,
      email,
      info: combinedInfo,
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Contact</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                <div className={`flex items-center w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  <PhoneInput
                    id="phone_number"
                    international
                    defaultCountry="US"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    onBlur={() => validate(phoneNumber, email)}
                    required
                    numberInputProps={{ className: 'text-gray-900 dark:text-gray-100 bg-transparent w-full focus:outline-none' }}
                  />
                </div>
                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={handleEmailChange} onBlur={() => validate(phoneNumber, email)} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                <input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <input id="gender" type="text" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="job" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job</label>
                    <input id="job" type="text" value={job} onChange={(e) => setJob(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
            <div>
              <label htmlFor="info" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Info</label>
              <textarea id="info" value={info} onChange={(e) => setInfo(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}  className="mr-2 text-gray-300 dark:text-white border-0 bg-red-500 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700">
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !phoneNumber || Object.keys(errors).length > 0 || isLoading} className="bg-primary hover:bg-primary-dark text-white">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
