import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { auth } from '@/lib/auth';
import type { VapiCallResponse } from '@/lib/types';

export const runtime = 'edge';

interface Env {
    VAPI_PRIVATE_KEY: string;
    CASTFORM_DB: D1Database;
}

// GET endpoint to retrieve detailed call information
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const callId = resolvedParams.id;
        const { VAPI_PRIVATE_KEY, CASTFORM_DB } = getRequestContext().env as Env;

        if (!VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'VAPI_PRIVATE_KEY is not configured' }, { status: 500 });
        }

        // First, get the call record from our database to verify ownership and get vapi_call_id
        const callRecord = await CASTFORM_DB.prepare(`
            SELECT 
                c.*,
                Contacts.name as contact_name,
                Contacts.phone_number as contact_phone,
                Agents.name as agent_name
            FROM Calls c
            JOIN Contacts ON c.contact_id = Contacts.id
            JOIN Agents ON c.agent_id = Agents.id
            WHERE c.id = ? AND c.user_id = ?
        `).bind(callId, session.user.id).first();

        if (!callRecord) {
            return NextResponse.json({ error: 'Call not found or access denied' }, { status: 404 });
        }

        // Fetch detailed call information from Vapi API
        const vapiResponse = await fetch(`https://api.vapi.ai/call/${callRecord.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            },
        });

        if (!vapiResponse.ok) {
            const errorData = await vapiResponse.json();
            console.error('Vapi API error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch call details', details: errorData }, { status: vapiResponse.status });
        }

        const vapiCallData = await vapiResponse.json() as VapiCallResponse;

        // Update our local call record with duration and cost if available
        const duration = vapiCallData.startedAt && vapiCallData.endedAt 
            ? Math.round((new Date(vapiCallData.endedAt).getTime() - new Date(vapiCallData.startedAt).getTime()) / 1000)
            : null;

        if (duration !== callRecord.duration || 
            (vapiCallData.cost && vapiCallData.cost !== callRecord.cost)) {
            
            await CASTFORM_DB.prepare(`
                UPDATE Calls 
                SET duration = ?, cost = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                duration,
                vapiCallData.cost || null,
                callId
            ).run();
        }

        // Combine local call record with Vapi data
        const combinedCallData = {
            ...callRecord,
            vapiData: vapiCallData,
            transcript: vapiCallData.transcript,
            recordingUrl: vapiCallData.recordingUrl,
            stereoRecordingUrl: vapiCallData.stereoRecordingUrl,
            summary: vapiCallData.summary,
            analysis: vapiCallData.analysis,
            artifacts: vapiCallData.artifacts,
            messages: vapiCallData.messages,
            endedReason: vapiCallData.endedReason,
            startedAt: vapiCallData.startedAt,
            endedAt: vapiCallData.endedAt,
        };

        return NextResponse.json(combinedCallData);

    } catch (error) {
        console.error('Error fetching call details:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
