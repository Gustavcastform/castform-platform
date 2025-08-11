import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

type Env = {
    CASTFORM_DB: D1Database;
};

interface VapiWebhookMessage {
    message: {
        type: string;
        call: {
            id: string;
        };
        status?: string;
        endedReason?: string;
        cost?: number;
        transcript?: string;
        recordingUrl?: string;
        stereoRecordingUrl?: string;
        startedAt?: string;
        endedAt?: string;
        durationSeconds?: number;
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as VapiWebhookMessage;
        const { message } = body;

        console.log('Received Vapi webhook:', message.type, 'Status:', message.status);

        // Only process calls that have ended
        const isEndOfCallReport = message.type === 'end-of-call-report';
        const isStatusUpdateEnded = message.type === 'status-update' && message.status === 'ended';

        if (!isEndOfCallReport && !isStatusUpdateEnded) {
            return NextResponse.json({ success: true, message: 'Event ignored' });
        }

        const { CASTFORM_DB } = getRequestContext().env as Env;
        const vapiCallId = message.call.id;

        const callRecord = await CASTFORM_DB.prepare('SELECT id FROM Calls WHERE id = ?').bind(vapiCallId).first();

        if (!callRecord) {
            console.error('Call record not found for id:', vapiCallId);
            return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
        }

        // Determine status based on end reason
        let callStatus = 'completed';
        if (message.endedReason === 'customer-busy') {
            callStatus = 'customer-busy';
        }

        const updateFields: any = {
            status: callStatus,
                end_reason: message.endedReason || 'Unknown',
            updated_at: new Date().toISOString(),
        };

        if (isEndOfCallReport) {
            updateFields.cost = message.cost || null;
            updateFields.transcript = message.transcript || null;
            updateFields.recording_url = message.recordingUrl || message.stereoRecordingUrl || null;
            if (message.durationSeconds) {
                updateFields.duration = Math.round(message.durationSeconds);
            }
        }

        const setClauses = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateFields), vapiCallId];

        await CASTFORM_DB.prepare(`UPDATE Calls SET ${setClauses} WHERE id = ?`).bind(...values).run();

        console.log(`✅ Updated call record for vapi_call_id: ${vapiCallId}`);

        return NextResponse.json({ success: true, message: 'Call updated successfully' });
    } catch (error) {
        console.error('🔥 Vapi webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}