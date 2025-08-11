'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Phone, Clock, DollarSign, Eye, Loader2, FileText, Download } from 'lucide-react'
import type { Contact } from '@/lib/types'

interface CallWithDetails {
  id: string
  contact_id: string
  agent_id: string
  call_name: string
  status?: string
  end_reason?: string
  duration?: number
  cost?: number
  transcript?: string
  recording_url?: string
  created_at: string
  updated_at: string
  contact_name: string
  contact_phone: string
  agent_name: string
}

interface CallHistoryModalProps {
  show: boolean
  contact: Contact | null
  onClose: () => void
}

export default function CallHistoryModal({ show, contact, onClose }: CallHistoryModalProps) {
  const [calls, setCalls] = useState<CallWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTranscriptModal, setShowTranscriptModal] = useState(false)
  const [selectedCall, setSelectedCall] = useState<CallWithDetails | null>(null)

  useEffect(() => {
    if (show && contact) {
      fetchCallHistory()
    }
  }, [show, contact])

  const fetchCallHistory = async () => {
    if (!contact) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/calls?contactId=${contact.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch call history')
      }
      const callsData = await response.json() as CallWithDetails[]
      setCalls(callsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch call history')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00'
    return `$${cost.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleViewDetails = (callId: string) => {
    // TODO: Implement call details modal or navigation
    console.log('View call details:', callId)
  }

  const handleViewTranscript = (call: CallWithDetails) => {
    setSelectedCall(call)
    setShowTranscriptModal(true)
  }

  const handleDownloadRecording = async (call: CallWithDetails) => {
    if (!call.recording_url) {
      alert('No recording available for this call')
      return
    }

    try {
      const response = await fetch(call.recording_url)
      if (!response.ok) throw new Error('Failed to fetch recording')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `call-${call.id}-recording.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading recording:', error)
      alert('Failed to download recording')
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Call History
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {contact?.name} ({contact?.phone_number})
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading call history...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <Button onClick={fetchCallHistory} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : calls.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Call Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        End Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {calls.map((call) => (
                      <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {call.call_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {call.agent_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(call.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDuration(call.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            call.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : call.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : call.status === 'customer-busy'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {call.status === 'customer-busy' ? 'Customer Busy' : call.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {call.end_reason ? call.end_reason.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatCost(call.cost)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => handleViewTranscript(call)}
                              variant="outline"
                              size="sm"
                              disabled={!call.transcript}
                              title={call.transcript ? 'View transcript' : 'No transcript available'}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDownloadRecording(call)}
                              variant="outline"
                              size="sm"
                              disabled={!call.recording_url}
                              title={call.recording_url ? 'Download recording' : 'No recording available'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No calls found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This contact hasn't been called yet.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
      
      {/* Transcript Modal */}
      {showTranscriptModal && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Call Transcript
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedCall.call_name} • {formatDate(selectedCall.created_at)}
                </p>
              </div>
              <Button
                onClick={() => setShowTranscriptModal(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedCall.transcript ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Transcript</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {selectedCall.transcript}
                      </div>
                    </div>
                  </div>
                  
                  {/* Call Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{formatDuration(selectedCall.duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{formatCost(selectedCall.cost)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCall.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : selectedCall.status === 'customer-busy'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {selectedCall.status === 'customer-busy' ? 'Customer Busy' : selectedCall.status || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Reason</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedCall.end_reason ? selectedCall.end_reason.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No transcript available</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This call doesn't have a transcript yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
