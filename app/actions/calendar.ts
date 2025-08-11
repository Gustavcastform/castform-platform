'use server';

import { auth, signOut } from "@/lib/auth";
import { deleteCalendarConnection, getCalendarConnection, updateCalendarConnection, createCalendarConnection } from '@/lib/calendar/calendar';
import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from "next/navigation";

export async function connectGoogleCalendar() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("User must be authenticated to connect a calendar.");
    }

    const { env } = getRequestContext();
    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${env.AUTH_URL}/api/oauth/google/callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: session.user.id, // Using user ID as state for security
    });

    redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function disconnectCalendar(userId: string) {
    await deleteCalendarConnection(userId);
    revalidatePath('/calendar');
}

export async function createBooking(
    userId: string,
    summary: string,
    description: string,
    startTime: Date,
    endTime: Date,
    timeZone: string = 'UTC'
) {
    const { env } = getRequestContext();
    const connection = await getCalendarConnection(userId);

    if (!connection || connection.provider !== 'google') {
        throw new Error('No Google Calendar connection found or is not a Google provider.');
    }

    const event = {
        summary,
        description,
        start: { dateTime: startTime.toISOString(), timeZone },
        end: { dateTime: endTime.toISOString(), timeZone },
    };

    const { calendarResponse, updatedConnection } = await makeCalendarApiCall(userId, connection, event, env);

    if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json();
        throw new Error(`Failed to create calendar event: ${JSON.stringify(errorData)}`);
    }

    await updateCalendarConnection(userId, {
        ...updatedConnection,
        bookings_count: (updatedConnection.bookings_count || 0) + 1,
    });

    revalidatePath('/calendar');
    console.log('🎉 Booking created successfully!');

    return await calendarResponse.json();
}


export async function createTestBooking(userId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow

    const startTime = tomorrow;
    const endTime = new Date(tomorrow.getTime() + 15 * 60 * 1000); // 15 minutes later

    await createBooking(
        userId,
        'Castform AI Test Booking',
        'This is a test event created by your Castform AI agent.',
        startTime,
        endTime
    );
}

interface CreateMeetingParams {
    userId: string;
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees: { email: string }[];
    timeZone?: string;
}

async function makeCalendarApiCall(userId: string, connection: any, event: any, env: any) {
    let currentConnection = { ...connection };

    const doFetch = async (accessToken: string) => {
        return await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
    };

    let calendarResponse = await doFetch(currentConnection.access_token);

    if (calendarResponse.status === 401) {
        console.log('Access token invalid, forcing refresh...');

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                refresh_token: currentConnection.refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        const refreshedTokens: { access_token: string; expires_in: number; error?: string } = await response.json();

        if (!response.ok) {
            await signOut({ redirect: false });
            throw new Error(`Failed to refresh token: ${refreshedTokens.error || JSON.stringify(refreshedTokens)}`);
        }

        currentConnection.access_token = refreshedTokens.access_token;
        currentConnection.expires_at = Math.floor(Date.now() / 1000) + refreshedTokens.expires_in;
        await updateCalendarConnection(userId, currentConnection);

        // Retry the request with the new token
        console.log('Retrying API call with new token...');
        calendarResponse = await doFetch(currentConnection.access_token);
    }

    return { calendarResponse, updatedConnection: currentConnection };
}

export async function createMeeting({
    userId,
    summary,
    description,
    startTime,
    endTime,
    attendees,
    timeZone = 'UTC',
}: CreateMeetingParams) {
    const { env } = getRequestContext();
    const connection = await getCalendarConnection(userId);

    if (!connection || connection.provider !== 'google') {
        throw new Error('No Google Calendar connection found or is not a Google provider.');
    }

    const event = {
        summary,
        description,
        start: { dateTime: startTime.toISOString(), timeZone },
        end: { dateTime: endTime.toISOString(), timeZone },
        attendees,
    };

    const { calendarResponse, updatedConnection } = await makeCalendarApiCall(userId, connection, event, env);

    if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json();
        throw new Error(`Failed to create calendar event: ${JSON.stringify(errorData)}`);
    }

    await updateCalendarConnection(userId, {
        ...updatedConnection,
        bookings_count: (updatedConnection.bookings_count || 0) + 1,
    });

    revalidatePath('/calendar');
    console.log('🎉 Meeting created successfully!');

    return await calendarResponse.json();
}