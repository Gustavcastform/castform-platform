'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, Pencil, Trash2, History } from 'lucide-react'
import type { ContactList, Contact } from '@/lib/types'

interface ContactsTableProps {
  selectedList: ContactList
  filteredContacts: Contact[]
  selectedContacts: string[]
  searchTerm: string
  onSearchChange: (term: string) => void
  onSelectAll: (checked: boolean) => void
  onSelectContact: (contactId: string, checked: boolean) => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (contact: Contact) => void
  onViewCallHistory: (contact: Contact) => void
  onCallContact: (contact: Contact) => void
  onAddContact: () => void
  onImport: () => void
  onBatchCall: (contactIds: string[]) => void
  onBatchDelete: (contactIds: string[]) => void
}

export default function ContactsTable({
  selectedList,
  filteredContacts,
  selectedContacts,
  searchTerm,
  onSearchChange,
  onSelectAll,
  onSelectContact,
  onEditContact,
  onDeleteContact,
  onViewCallHistory,
  onCallContact,
  onAddContact,
  onImport,
  onBatchCall,
  onBatchDelete,
}: ContactsTableProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length;
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedContacts, filteredContacts.length]);

  const truncateText = (text: string | null | undefined, maxLength: number): string => {
    if (!text) return '—';
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-6 flex-shrink-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedList.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredContacts.length} contacts
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={onImport}
              className="text-gray-700 dark:text-gray-700 hover:dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Import CSV
            </Button>
            <Button
              onClick={onAddContact}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              + Add Contact
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {selectedContacts.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => onBatchCall(selectedContacts)} size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Batch Call ({selectedContacts.length})
              </Button>
              <Button onClick={() => onBatchDelete(selectedContacts)} size="sm" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedContacts.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto">
        <div className="relative">
          {filteredContacts.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th scope="col" className="p-4">
                    <div className="flex items-center">
                      <input
                        ref={checkboxRef}
                        id="checkbox-all"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        onChange={(e) => onSelectAll(e.target.checked)}
                        checked={filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                      />
                      <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Info</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="p-4">
                      <div className="flex items-center">
                        <input
                          id={`checkbox-table-search-${contact.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={(e) => onSelectContact(contact.id, e.target.checked)}
                        />
                        <label htmlFor={`checkbox-table-search-${contact.id}`} className="sr-only">checkbox</label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{contact.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contact.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{truncateText(contact.email, 25)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{truncateText(contact.info, 30)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                                                <Button onClick={() => onCallContact(contact)} variant="ghost" size="icon" className="text-green-400 hover:text-green-600">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => onViewCallHistory(contact)} variant="ghost" size="icon" className="text-gray-400 hover:text-indigo-600">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => onEditContact(contact)} variant="ghost" size="icon" className="text-gray-400 hover:text-indigo-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => onDeleteContact(contact)} variant="ghost" size="icon" className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No contacts found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding a contact'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}