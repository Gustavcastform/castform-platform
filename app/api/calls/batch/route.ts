import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { auth } from '@/lib/auth';
import { checkUserCallEligibility } from '@/lib/billing';
import type { Contact, Agent } from '@/lib/types';


const formatToE164 = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.trim().startsWith('+')) {
        return `+${digits}`;
    }
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    return `+${digits}`;
};

export const runtime = 'edge';

interface BatchCallRequest {
    agentId: string;
    phoneNumberId: string;
    contacts: Contact[];
}

interface Env {
    VAPI_PRIVATE_KEY: string;
    CASTFORM_DB: D1Database;
}

interface ContactCallResult {
    contactId: string;
    contactName: string;
    contactPhone: string;
    success: boolean;
    callId?: string;
    error?: string;
}

interface BatchCallResult {
    success: boolean;
    totalContacts: number;
    successfulCalls: number;
    failedCalls: number;
    errors: string[];
    callIds: string[];
    contactResults: ContactCallResult[];
}

export async function POST(req: Request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Received batch call request on /api/calls/batch');
        const requestText = await req.text();
        console.log('Raw request body text:', requestText);

        if (!requestText) {
            return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
        }

        let body;
        try {
            body = JSON.parse(requestText);
        } catch (e) {
            console.error('Failed to parse JSON body:', e);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log('Parsed request body:', body);
        const { agentId, phoneNumberId, contacts } = body as BatchCallRequest;

        if (!agentId || !phoneNumberId || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json({ error: 'Missing required fields or empty contact list' }, { status: 400 });
        }

        if (contacts.length > 100) {
            return NextResponse.json({ error: 'Maximum 100 contacts allowed per batch call' }, { status: 400 });
        }

        const { VAPI_PRIVATE_KEY, CASTFORM_DB } = getRequestContext().env as Env;

        if (!VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'VAPI_PRIVATE_KEY is not configured' }, { status: 500 });
        }

        // Check if user can make calls (subscription status and usage limits)
        const eligibility = await checkUserCallEligibility(session.user.id);
        if (!eligibility.canMakeCall) {
            return NextResponse.json({ 
                error: 'Batch calls not allowed', 
                reason: eligibility.reason,
                currentUsage: eligibility.currentUsage,
                usageLimit: eligibility.thresholdAmount,
                subscriptionStatus: eligibility.subscriptionStatus
            }, { status: 403 });
        }

        // Get agent details
        const agent = await CASTFORM_DB.prepare('SELECT * FROM Agents WHERE id = ? AND user_id = ?')
            .bind(agentId, session.user.id)
            .first() as Agent | null;

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found or access denied' }, { status: 404 });
        }

        console.log(`Processing batch call for ${contacts.length} contacts`);

        const result: BatchCallResult = {
            success: true,
            totalContacts: contacts.length,
            successfulCalls: 0,
            failedCalls: 0,
            errors: [],
            callIds: [],
            contactResults: []
        };

        // Process contacts in parallel batches of 10
        console.log(`Processing ${contacts.length} contacts in parallel batches of 10`);
        
        const callDate = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();
        const batchSize = 10;
        
        // Helper function to process a single contact
        const processContact = async (contact: Contact): Promise<void> => {
            const contactResult: ContactCallResult = {
                contactId: contact.id,
                contactName: contact.name,
                contactPhone: contact.phone_number,
                success: false
            };

            try {
                const formattedNumber = formatToE164(contact.phone_number);
                
                const requestBody = {
                    assistantId: agent.id,
                    phoneNumberId: phoneNumberId,
                    customer: {
                        number: formattedNumber,
                    },
                    assistantOverrides: {
                        variableValues: {
                            name: contact.name || '',
                            phone_number: contact.phone_number || '',
                            email: contact.email || '',
                            info: contact.info || '',
                        },
                    },
                };

                console.log(`Making call for ${contact.name} (${contact.phone_number})`);

                // Make individual call to Vapi
                const response = await fetch('https://api.vapi.ai/call/phone', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorData = await response.json() as { message?: string };
                    const errorMessage = errorData.message || 'Unknown error';
                    console.error(`Vapi API error for ${contact.name}:`, errorData);
                    
                    contactResult.error = errorMessage;
                    result.errors.push(`Call failed for ${contact.name}: ${errorMessage}`);
                    result.failedCalls++;
                    result.contactResults.push(contactResult);
                    return;
                }

                const callData = await response.json() as any;
                console.log(`Call initiated for ${contact.name} (Call ID: ${callData.id})`);

                // Save call record to database
                const callName = `${contact.phone_number} - ${agent.name} - ${callDate}`;
                
                try {
                    await CASTFORM_DB.prepare(`
                        INSERT INTO Calls (
                            id, user_id, contact_id, agent_id,
                            call_name, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        callData.id,
                        session.user.id,
                        contact.id,
                        agent.id,
                        callName,
                        'in-progress',
                        now,
                        now
                    ).run();

                    // Success!
                    contactResult.success = true;
                    contactResult.callId = callData.id;
                    result.successfulCalls++;
                    result.callIds.push(callData.id);
                    console.log(`Successfully saved call record for ${contact.name}`);
                } catch (dbError) {
                    console.error(`Database error for ${contact.name}:`, dbError);
                    const errorMessage = 'Failed to save call record';
                    contactResult.error = errorMessage;
                    result.errors.push(`${errorMessage} for ${contact.name}`);
                    result.failedCalls++;
                }

            } catch (error) {
                console.error(`Error processing ${contact.name}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                contactResult.error = errorMessage;
                result.errors.push(`Failed to process call for ${contact.name}: ${errorMessage}`);
                result.failedCalls++;
            }

            result.contactResults.push(contactResult);
        };

        // Process contacts in batches
        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(contacts.length / batchSize);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} contacts)`);
            
            // Process all contacts in this batch in parallel
            await Promise.all(batch.map(contact => processContact(contact)));
            
            console.log(`Completed batch ${batchNumber}/${totalBatches}`);
        }

        // Update success status based on results
        result.success = result.successfulCalls > 0;

        console.log('Batch call result:', result);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Unexpected error in batch call:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}
