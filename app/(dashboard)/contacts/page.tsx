'use client'

import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'

import ContactsTable from '@/components/contacts/ContactsTable'

import AddContactModal from '@/components/contacts/AddContactModal';
import EditContactModal from '@/components/contacts/EditContactModal';
import DeleteContactModal from '@/components/contacts/DeleteContactModal';
import CallHistoryModal from '@/components/contacts/CallHistoryModal';
import CsvImportModal from '@/components/contacts/CsvImportModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import BatchCallModal from '@/components/contacts/BatchCallModal';
import { AgentSelectionModal } from '@/components/dashboard/AgentSelectionModal';
import type { ContactList, Contact } from '@/lib/types'

export const runtime = 'edge';

export default function ContactsPage() {
  console.log('👥 Contact management loading faster than a speed-dial champions!')
  
  // State management
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAgentModalOpen, setAgentModalOpen] = useState(false);
  const [isBatchCallModalOpen, setBatchCallModalOpen] = useState(false);

  // Loading state for lists
  const [isFetchingLists, setIsFetchingLists] = useState(true);

  // Modal states

  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [callHistoryContact, setCallHistoryContact] = useState<Contact | null>(null);

  // Form states

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContactLists = useCallback(async () => {
    setIsFetchingLists(true);
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contact lists');
      const data: ContactList[] = await response.json();
      setContactLists(data);
      setIsFetchingLists(false);
      if (data.length > 0 && selectedListId === null) {
        const firstList = data[0];
        if (firstList && typeof firstList.id === 'number') {
          setSelectedListId(firstList.id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [selectedListId]);

  useEffect(() => {
    if (!isFetchingLists) return;
  }, [isFetchingLists]);

  const fetchContacts = useCallback(async (listId: number) => {
    try {
      const response = await fetch(`/api/contacts?listId=${listId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data: Contact[] = await response.json();
      setContacts(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchContactLists();
  }, [fetchContactLists]);

  useEffect(() => {
    if (selectedListId !== null) {
      fetchContacts(selectedListId);
    }
  }, [selectedListId, fetchContacts]);

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingContact(null);
    setEditModalOpen(false);
  };

  const handleUpdateContact = async (contactData: Contact) => {
    if (!contactData.id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (!response.ok) throw new Error('Failed to update contact');
      toast.success('Contact updated successfully!');
      handleCloseEditModal();
      fetchContacts(selectedListId!);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update contact.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (contactData: Omit<Contact, 'id' | 'list_id' | 'created_at' | 'updated_at'>) => {
    if (selectedListId === null) {
      toast.error('No contact list selected.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactData, list_id: selectedListId }),
      });

      if (response.ok) {
        toast.success('Contact added successfully!');
        if (selectedListId !== null) fetchContacts(selectedListId);
        setAddContactModalOpen(false);
      } else {
        const errorData = await response.json() as { error?: string };
        toast.error(errorData.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedList = contactLists.find(list => list.id === selectedListId);
  const listContacts = selectedListId !== null ? contacts.filter(contact => contact.list_id === selectedListId) : [];
  const filteredContacts = listContacts.filter(contact => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      contact.phone_number.toLowerCase().includes(searchLower) ||
      (contact.info && contact.info.toLowerCase().includes(searchLower))
    );
  });

  // Event handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedContacts(checked ? filteredContacts.map(c => c.id) : []);
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    setSelectedContacts(prev => 
      checked ? [...prev, contactId] : prev.filter(id => id !== contactId)
    );
  };






  const handleDeleteContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowDeleteContactModal(true);
  };

  interface BulkDeleteResult {
    success: boolean;
    deletedCount: number;
    error?: string;
  }

  const handleBatchDelete = (contactIds: string[]) => {
    if (contactIds.length > 0) {
      setShowBatchDeleteModal(true);
    }
  };

  const confirmBatchDelete = async () => {
    setIsLoading(true);
    setShowBatchDeleteModal(false);
    try {
      const payload = { contactIds: selectedContacts, contactListId: selectedList!.id };
      console.log('Sending payload for bulk delete:', payload);

      const response = await fetch('/api/contacts/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: BulkDeleteResult = await response.json();

      if (response.ok && result.success && typeof result.deletedCount === 'number') {
        toast.success(`${result.deletedCount} contacts deleted successfully.`);
        if (selectedList?.id) {
          fetchContacts(selectedList.id); // Refresh contacts
        }
        setSelectedContacts([]); // Clear selection
      } else {
        throw new Error(result.error || 'Failed to delete contacts');
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error((error as Error).message);
    }
  };

  const handleCallClick = (contact: Contact) => {
    setSelectedContact(contact);
    setAgentModalOpen(true);
  };

  const handleViewCallHistory = (contact: Contact) => {
    setCallHistoryContact(contact);
    setShowCallHistoryModal(true);
  };

  const handleBatchCall = () => {
    console.log('handleBatchCall triggered. Selected contacts:', selectedContacts);
    setBatchCallModalOpen(true);
  };

  const handleSelectAgent = async (agentId: string) => {
    if (!selectedContact) return;

    setIsLoading(true);
    try {
      const phoneRes = await fetch('/api/phone-numbers');
      if (!phoneRes.ok) {
        if (phoneRes.status === 404) {
          throw new Error('Please connect a phone number in settings before making a call.');
        }
        throw new Error('Failed to fetch your connected phone number.');
      }
      const { id: phoneNumberId } = await phoneRes.json() as { id: string };





      const payload = {
        agentId,
        phoneNumberId,
        contact: {
          id: selectedContact.id,
          name: selectedContact.name,
          email: selectedContact.email,
          phone_number: selectedContact.phone_number,
          info: selectedContact.info,
          list_id: selectedContact.list_id,
        },
      };

      console.log('About to send payload:', payload);
      console.log('Stringified payload:', JSON.stringify(payload));

      const callRes = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!callRes.ok) {
        const errorData = await callRes.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to initiate call');
      }

      toast.success('Call initiated successfully!');
      setAgentModalOpen(false);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContactConfirm = async () => {
    if (!editingContact) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      toast.success('Contact deleted successfully!');
      setShowDeleteContactModal(false);
      setEditingContact(null);
      if (selectedListId) fetchContacts(selectedListId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete contact.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
      `}</style>

      {/* Page Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your contacts for outreach campaigns.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 space-y-6 overflow-hidden min-w-0">


        {/* Contacts Table Area */}
        {selectedList && (
          <div className="flex-1 overflow-hidden min-h-0">
            <ContactsTable
              selectedList={selectedList}
              filteredContacts={filteredContacts}
              selectedContacts={selectedContacts}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectAll={handleSelectAll}
              onSelectContact={handleSelectContact}
              onEditContact={handleOpenEditModal}
              onDeleteContact={handleDeleteContact}
              onCallContact={handleCallClick}
              onViewCallHistory={handleViewCallHistory}
              onAddContact={() => setAddContactModalOpen(true)}
              onImport={() => setShowCsvImportModal(true)}
              onBatchCall={handleBatchCall}
            onBatchDelete={handleBatchDelete}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddContactModal
        show={isAddContactModalOpen}
        isLoading={isLoading}
        onClose={() => setAddContactModalOpen(false)}
        onAddContact={handleAddContact}
        listName={selectedList?.name || ''}
      />
      <EditContactModal
        show={isEditModalOpen}
        isLoading={isLoading}
        onClose={handleCloseEditModal}
        onUpdateContact={handleUpdateContact}
        contact={editingContact}
      />
      <ConfirmationModal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        onConfirm={confirmBatchDelete}
        isLoading={isLoading}
        title={`Delete ${selectedContacts.length} Contacts`}
        description="Are you sure you want to delete the selected contacts? This action cannot be undone."
        confirmText="Delete"
      />

      <DeleteContactModal
        show={showDeleteContactModal}
        isLoading={isLoading}
        onClose={() => setShowDeleteContactModal(false)}
        onConfirm={handleDeleteContactConfirm}
        contactName={editingContact?.name || ''}
      />
      <CallHistoryModal
        show={showCallHistoryModal}
        contact={callHistoryContact}
        onClose={() => {
          setShowCallHistoryModal(false);
          setCallHistoryContact(null);
        }}
      />
      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        listId={selectedListId || 0}
        onImportComplete={() => {
          if (selectedListId) {
            fetchContacts(selectedListId);
          }
        }}
      />

      <BatchCallModal
        isOpen={isBatchCallModalOpen}
        onClose={() => setBatchCallModalOpen(false)}
        selectedContacts={selectedContacts.map(id => filteredContacts.find(c => c.id === id)!).filter(Boolean)}
        onBatchCallComplete={() => {
          setBatchCallModalOpen(false);
          setSelectedContacts([]);
          // Optionally refresh calls data or show success message
        }}
      />

      {selectedContact && (
        <AgentSelectionModal
          isOpen={isAgentModalOpen}
          onClose={() => setAgentModalOpen(false)}
          onSelectAgent={handleSelectAgent}
          contactNumber={selectedContact.phone_number}
        />
      )}
    </div>
  );
}