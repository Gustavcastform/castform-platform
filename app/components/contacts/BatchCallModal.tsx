'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Phone, AlertCircle, CheckCircle, Loader2, ChevronDown } from 'lucide-react'
import type { Contact, Agent } from '@/lib/types'

interface BatchCallModalProps {
  isOpen: boolean
  onClose: () => void
  selectedContacts: Contact[]
  onBatchCallComplete: () => void
}

interface ContactCallResult {
  contactId: string
  contactName: string
  contactPhone: string
  success: boolean
  callId?: string
  error?: string
}

interface BatchCallResult {
  success: boolean
  totalContacts: number
  successfulCalls: number
  failedCalls: number
  errors: string[]
  callIds: string[]
  contactResults: ContactCallResult[]
}

export default function BatchCallModal({
  isOpen,
  onClose,
  selectedContacts,
  onBatchCallComplete,
}: BatchCallModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [result, setResult] = useState<BatchCallResult | null>(null);
  const [error, setError] = useState<string>('');
  const [openErrorId, setOpenErrorId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json() as Agent[];
      setAgents(data);
      if (data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setIsLoadingAgents(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (isOpen) {
      console.log('BatchCallModal is now open. Resetting state and fetching agents.');
      // Reset state when modal opens
      setResult(null);
      setError('');
      setIsLoading(false);
      // Fetch agents
      fetchAgents();
    }
  }, [isOpen, fetchAgents]);

  const handleBatchCall = async () => {
    if (!selectedAgentId) {
      setError('Please select an agent');
      return;
    }
    if (selectedContacts.length === 0) {
      setError('No contacts selected');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const phoneRes = await fetch('/api/phone-numbers');
      if (!phoneRes.ok) {
        if (phoneRes.status === 404) {
          throw new Error('Please connect a phone number in settings before making calls.');
        }
        throw new Error('Failed to fetch your connected phone number.');
      }
      const { id: phoneNumberId } = await phoneRes.json() as { id: string };

      const batchCallRes = await fetch('/api/calls/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          phoneNumberId,
          contacts: selectedContacts,
        }),
      });

      const batchResult = await batchCallRes.json() as BatchCallResult;
      if (!batchCallRes.ok) {
        throw new Error(batchResult.errors[0] || 'Failed to initiate batch calls');
      }
      
      console.log('Received batch call result:', batchResult);
      setResult(batchResult);

    } catch (err) {
      console.error('Error initiating batch calls:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setResult({ 
        success: false, 
        totalContacts: selectedContacts.length, 
        successfulCalls: 0, 
        failedCalls: selectedContacts.length, 
        errors: [errorMessage],
        callIds: [],
        contactResults: selectedContacts.map(c => ({ 
          contactId: c.id, 
          contactName: c.name, 
          contactPhone: c.phone_number, 
          success: false, 
          error: errorMessage 
        }))
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    // The useEffect hook will handle state reset when the modal is re-opened.
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Batch Call
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result && (
            <>
              {/* Selected Contacts Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Selected Contacts ({selectedContacts.length})
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedContacts.map((contact) => (
                    <div key={contact.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.name} - {contact.phone_number}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Agent
                </label>
                {isLoadingAgents ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading agents...</span>
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select an agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`flex items-start space-x-2 p-3 border rounded-lg ${
                result.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    result.success 
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    Batch Call Results
                  </p>
                  <div className="mt-1 text-xs space-y-1">
                    <div className={result.success ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                      {result.successfulCalls} successful out of {result.totalContacts} contacts
                    </div>
                    {result.failedCalls > 0 && (
                      <div className="text-red-600 dark:text-red-500">
                        {result.failedCalls} failed calls
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Contact Results */}
              {result.contactResults && result.contactResults.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Individual Results:
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {result.contactResults.map((contactResult) => (
                      <div key={contactResult.contactId}>
                        <div className={`flex items-center justify-between p-2 rounded text-xs ${
                          contactResult.success 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          <div className="flex-1">
                            <div className="font-medium">{contactResult.contactName}</div>
                            <div className="text-gray-600 dark:text-gray-400">{contactResult.contactPhone}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {contactResult.success ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-700 dark:text-green-300">Success</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-700 dark:text-red-300">Failed</span>
                                <button 
                                  onClick={() => setOpenErrorId(openErrorId === contactResult.contactId ? null : contactResult.contactId)}
                                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${openErrorId === contactResult.contactId ? 'rotate-180' : ''}`} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {openErrorId === contactResult.contactId && !contactResult.success && contactResult.error && (
                          <div className="p-2 mt-1 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-b-lg">
                            <strong>Error:</strong> {contactResult.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleBatchCall}
              disabled={isLoading || !selectedAgentId || selectedContacts.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Initiating Calls...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Call {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
