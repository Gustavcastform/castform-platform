import { NextRequest, NextResponse } from 'next/server';
import { createMeeting } from '@/actions/calendar';
import { z } from 'zod';

export const runtime = 'edge';

const bookingSchema = z.object({
    dateTime: z.string().datetime(),
    attendeeEmail: z.string().email('Invalid email format'),
    description: z.string().min(1, 'Description cannot be empty.'),
});

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    try {
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId in query parameters' }, { status: 400 });
        }

        const body = await req.json();
        const validation = bookingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const { dateTime, attendeeEmail, description } = validation.data;

        const startTime = new Date(dateTime);
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minute meeting

        const event = await createMeeting({
            userId,
            summary: description,
            description: `Meeting with ${attendeeEmail}, booked by Castform AI.`,
            startTime,
            endTime,
            attendees: [{ email: attendeeEmail }],
        });

        return NextResponse.json({ 
            message: `Your meeting has been successfully booked for ${startTime.toLocaleString()}`,
            event
        }, { status: 201 });

    } catch (error) {
        console.error(' Error creating meeting:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to create meeting', details: errorMessage }, { status: 500 });
    }
}
