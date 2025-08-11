import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { auth } from '@/lib/auth';
import { checkUserCallEligibility } from '@/lib/billing';
import type { Contact, Call, Agent } from '@/lib/types';

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

interface CreateCallRequest {
    agentId: string;
    phoneNumberId: string;
    contact: Contact;
}

interface Env {
    VAPI_PRIVATE_KEY: string;
    CASTFORM_DB: D1Database;
}

export async function POST(req: Request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Received request on /api/calls');
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
        const { agentId, phoneNumberId, contact } = body as CreateCallRequest;

        if (!agentId || !phoneNumberId || !contact) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { VAPI_PRIVATE_KEY, CASTFORM_DB } = getRequestContext().env as Env;

        if (!VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'VAPI_PRIVATE_KEY is not configured' }, { status: 500 });
        }

        // Check if user can make calls (subscription status and usage limits)
        const eligibility = await checkUserCallEligibility(session.user.id);
        if (!eligibility.canMakeCall) {
            return NextResponse.json({ 
                error: eligibility.reason, 
                reason: eligibility.reason,
                currentUsage: eligibility.currentUsage,
                usageLimit: eligibility.thresholdAmount,
                subscriptionStatus: eligibility.subscriptionStatus
            }, { status: 403 });
        }

        // Get agent details for call name generation
        const agent = await CASTFORM_DB.prepare('SELECT * FROM Agents WHERE id = ? AND user_id = ?')
            .bind(agentId, session.user.id)
            .first() as Agent | null;


        console.log("Agent details:", agent)

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found or access denied' }, { status: 404 });
        }

        const formattedNumber = formatToE164(contact.phone_number);



        const response = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            },
            body: JSON.stringify({
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
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Vapi API error:', errorData);
            return NextResponse.json({ error: 'Failed to create call', details: errorData }, { status: response.status });
        }

        const callData = await response.json() as any;
        
        console.log("Reponse received with call data:", callData)
        // Generate call name: contact_number + agent + date
        const callDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const callName = `${contact.phone_number} - ${agent.name} - ${callDate}`;
        
        // Save call record to database
        const callId = crypto.randomUUID();
        const now = new Date().toISOString();
        console.log(session.user.id, agent.id, contact.id)
        
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
            
            console.log('Call record saved to database:', callId);
        } catch (dbError) {
            console.error('Failed to save call record:', dbError);
            // Don't fail the request if DB save fails, as the call was created successfully
        }
        
        return NextResponse.json({
            ...callData,
            localCallId: callId,
            callName
        });

    } catch (error) {
        console.error('Error creating call::', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET endpoint to retrieve calls for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const contactId = searchParams.get('contactId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { CASTFORM_DB } = getRequestContext().env as Env;

        let query = `
            SELECT 
                c.*,
                Contacts.name as contact_name,
                Contacts.phone_number as contact_phone,
                Agents.name as agent_name
            FROM Calls c
            JOIN Contacts ON c.contact_id = Contacts.id
            JOIN Agents ON c.agent_id = Agents.id
            WHERE c.user_id = ?
        `;
        
        const params = [session.user.id];
        
        if (contactId) {
            query += ' AND c.contact_id = ?';
            params.push(contactId);
        }
        
        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit.toString(), offset.toString());

        const { results: calls } = await CASTFORM_DB.prepare(query)
            .bind(...params)
            .all();

        return NextResponse.json(calls);

    } catch (error) {
        console.error('Error fetching calls:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
