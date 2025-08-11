'use client'

import { Button } from '@/components/ui/button';

interface DeleteContactModalProps {
  show: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName: string;
}

export default function DeleteContactModal({ show, isLoading, onClose, onConfirm, contactName }: DeleteContactModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="text-center">
            <svg className="mx-auto mb-4 text-red-500 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <h3 className="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Contact</h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the contact "{contactName}"? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
