'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { ContactList } from '@/lib/types';

interface ContactModalsProps {
  showCreateListModal: boolean;
  showEditListModal: boolean;
  showDeleteListModal: boolean;
  editingList: ContactList | null;
  deletingList: ContactList | null;
  isLoading: boolean;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onConfirmCreate: (name: string, description: string) => void;
  onConfirmEdit: (listId: number, name: string, description: string) => void;
  onConfirmDelete: () => void;
}

export default function ContactModals({
  showCreateListModal,
  showEditListModal,
  showDeleteListModal,
  editingList,
  deletingList,
  isLoading,
  onCloseCreate,
  onCloseEdit,
  onCloseDelete,
  onConfirmCreate,
  onConfirmEdit,
  onConfirmDelete,
}: ContactModalsProps) {
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');

  useEffect(() => {
    if (showEditListModal && editingList) {
      setListName(editingList.name);
      setListDescription(editingList.description || '');
    } else if (!showCreateListModal) {
      setListName('');
      setListDescription('');
    }
  }, [showEditListModal, editingList]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCreate(listName, listDescription);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingList && typeof editingList.id === 'number') {
      onConfirmEdit(editingList.id, listName, listDescription);
    }
  };

  const renderModalContent = (isEditing: boolean) => (
    <form onSubmit={isEditing ? handleUpdateSubmit : handleCreateSubmit} className="space-y-6">
      <div>
        <label htmlFor={isEditing ? 'editListName' : 'listName'} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          List Name *
        </label>
        <input
          id={isEditing ? 'editListName' : 'listName'}
          type="text"
          required
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Sales Prospects Q1"
        />
      </div>
      <div>
        <label htmlFor={isEditing ? 'editListDescription' : 'listDescription'} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id={isEditing ? 'editListDescription' : 'listDescription'}
          rows={3}
          value={listDescription}
          onChange={(e) => setListDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Brief description of this contact list..."
        />
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={isEditing ? onCloseEdit : onCloseCreate}             className="mr-2 text-gray-300 dark:text-white border-0 bg-red-500 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white">
          {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create List')}
        </Button>
      </div>
    </form>
  );



  return (
    <>
      <ModalWrapper open={showCreateListModal} onClose={onCloseCreate} title="Create Contact List">
        {renderModalContent(false)}
      </ModalWrapper>
      <ModalWrapper open={showEditListModal} onClose={onCloseEdit} title="Edit Contact List">
        {renderModalContent(true)}
      </ModalWrapper>
      <ModalWrapper open={showDeleteListModal} onClose={onCloseDelete} title="Delete Contact List">
        <div className="text-center">
            <svg className="mx-auto mb-4 text-red-500 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <h3 className="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">Are you sure?</h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              You are about to delete the contact list "{deletingList?.name}". This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <Button type="button" variant="outline" onClick={onCloseDelete} disabled={isLoading} className="text-black dark:text-black border-gray-300 dark:border-gray-600 dark:hover:text-white">Cancel</Button>
              <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={isLoading}             className="mr-2 text-gray-300 dark:text-white border-0 bg-red-500 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700">
                {isLoading ? 'Deleting...' : 'Delete List'}
              </Button>
            </div>
        </div>
      </ModalWrapper>
    </>
  );
}

const ModalWrapper = ({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="text-black dark:text-white hover:text-gray-600 dark:hover:text-red-">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
 