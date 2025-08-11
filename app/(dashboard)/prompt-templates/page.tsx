'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  category: string
}

const promptTemplates: PromptTemplate[] = [
  {
    id: 'booking-meetings',
    name: 'Booking Meetings Template',
    description: 'Professional template for booking meetings and appointments',
    category: 'Sales & Booking',
    prompt: `You are a professional appointment booking assistant for {{company_name}}. Your goal is to help customers schedule meetings efficiently and courteously.

**Customer Information:**
- Customer Name: {{name}}
- Phone Number: {{phone_number}}
- Email: {{email}}

**Instructions:**
1. **Greeting**: Start with a warm, professional greeting using the customer's name
2. **Purpose**: Clearly explain you're calling to help schedule a meeting
3. **Availability**: Ask about their preferred dates and times
4. **Confirmation**: Confirm all meeting details (date, time, location/platform)
5. **Follow-up**: Mention they'll receive a calendar invitation

**Key Guidelines:**
- Always use the customer's name ({{name}}) throughout the conversation
- Be patient and accommodating with scheduling requests
- Offer multiple time slots if the first option doesn't work
- Confirm contact information before ending the call
- Keep the tone professional but friendly
- If they're not available, offer to call back at a better time

**Sample Opening:**
"Hi {{name}}, this is [Your Name] calling from {{company_name}}. I hope I'm catching you at a good time. I'm reaching out to help schedule a meeting with you. Do you have a few minutes to discuss some available time slots?"

**Meeting Types to Offer:**
- Initial consultation (30 minutes)
- Product demo (45 minutes)
- Strategy session (60 minutes)

Remember to always be respectful of their time and provide clear next steps.`
  }
]

export default function PromptTemplatesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (template: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(template.prompt)
      setCopiedId(template.id)
      toast.success('Template copied to clipboard!')
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Failed to copy template')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Prompt Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pre-built prompt templates to help you create effective AI agents quickly.
        </p>
      </div>

      <div className="grid gap-6">
        {promptTemplates.map((template) => (
          <Card key={template.id} className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-1" />
                  <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(template)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedId === template.id ? 'Copied!' : 'Copy Template'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                  {template.prompt}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Available Variables:</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{name}}'}</code> - Customer's name</p>
                  <p><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{phone_number}}'}</code> - Customer's phone number</p>
                  <p><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{email}}'}</code> - Customer's email address</p>
                  <p><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{company_name}}'}</code> - Your company name</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">How to Use Templates:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>Click "Copy Template" to copy the prompt to your clipboard</li>
          <li>Go to your Agent creation/editing form</li>
          <li>Paste the template into the prompt field</li>
          <li>Customize the template with your specific requirements</li>
          <li>The system will automatically replace variables like {'{{name}}'} with actual customer data during calls</li>
        </ol>
      </div>
    </div>
  )
}
