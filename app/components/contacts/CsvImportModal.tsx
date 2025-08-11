'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  listId: number
  onImportComplete: () => void
}

interface ImportResult {
  success: boolean
  added: number
  ignored: number
  errors: string[]
  ignoredContacts: Array<{
    name: string
    reason: string
  }>
}

interface ParsedContact {
  name: string
  phone_number: string
  email?: string
  info?: string
}

export default function CsvImportModal({ isOpen, onClose, listId, onImportComplete }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setImportResult(null)
      setShowInstructions(false)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  const parseCSV = (csvText: string): ParsedContact[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const contacts: ParsedContact[] = []

    // Find column indices for required fields
    const nameIndex = headers.findIndex(h => 
      ['name', 'full name', 'fullname', 'contact name', 'first name'].includes(h)
    )
    const phoneIndex = headers.findIndex(h => 
      ['phone', 'phone number', 'phonenumber', 'mobile', 'cell', 'telephone'].includes(h)
    )
    const emailIndex = headers.findIndex(h => 
      ['email', 'email address', 'emailaddress', 'e-mail'].includes(h)
    )

    if (nameIndex === -1 || phoneIndex === -1 || emailIndex === -1) {
      throw new Error('CSV must contain Name, Phone Number, and Email columns')
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length < headers.length) continue

      const name = values[nameIndex]?.trim()
      const phone = values[phoneIndex]?.trim()
      const email = values[emailIndex]?.trim()
      
      if (!name || !phone || !email) continue

      const contact: ParsedContact = {
        name,
        phone_number: phone,
        email,
      }

      // Add other fields to info
      const infoFields: string[] = []
      headers.forEach((header, index) => {
        if (index !== nameIndex && index !== phoneIndex && index !== emailIndex && values[index]?.trim()) {
          const fieldName = header.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          infoFields.push(`${fieldName}: ${values[index].trim()}`)
        }
      })

      if (infoFields.length > 0) {
        contact.info = infoFields.join('\n')
      }

      contacts.push(contact)
    }

    return contacts
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const csvText = await file.text()
      const contacts = parseCSV(csvText)

      if (contacts.length === 0) {
        toast.error('No valid contacts found in CSV file')
        setIsProcessing(false)
        return
      }

      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts,
          list_id: listId,
        }),
      })

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.success) {
        toast.success(`Successfully imported ${result.added} contacts`)
        onImportComplete()
      } else {
        toast.error('Import failed: ' + result.errors.join(', '))
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to process CSV file: ' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setImportResult(null)
    setShowInstructions(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Contacts from CSV
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {showInstructions && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <h3 className="font-medium mb-2">CSV Format Requirements:</h3>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Required columns:</strong> Name, Phone Number, Email</li>
                    <li><strong>Optional columns:</strong> Any additional fields</li>
                    <li><strong>Phone numbers:</strong> Must start with + and country code (e.g., +1234567890, +447911123456)</li>
                    <li><strong>Email addresses:</strong> Must be valid format</li>
                    <li><strong>Additional fields:</strong> Will be added to the Info field</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    Column names are flexible: "Name", "Full Name", "Phone", "Phone Number", "Email", etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!file && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a CSV file to import contacts
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
            </div>
          )}

          {file && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Import Contacts'}
                </Button>
                <Button
                  onClick={resetModal}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Choose Different File
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Import Completed
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {importResult.added} contacts added successfully
                    {importResult.ignored > 0 && `, ${importResult.ignored} contacts ignored`}
                  </p>
                </div>
              </div>

              {importResult.ignoredContacts.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Ignored Contacts ({importResult.ignoredContacts.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.ignoredContacts.map((contact, index) => (
                          <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>{contact.name}:</strong> {contact.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
