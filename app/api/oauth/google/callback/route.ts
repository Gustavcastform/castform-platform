import { getRequestContext } from '@cloudflare/next-on-pages';
import { createCalendarConnection, getCalendarConnection, updateCalendarConnection } from '@/lib/calendar/calendar';
import { type CalendarConnection } from '@/lib/types';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

interface GoogleTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
}

export async function GET(request: Request) {
    const { env } = getRequestContext();
    const session = await auth();


    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // 1. Validate state to prevent CSRF attacks
    if (!state || state !== session?.user?.id) {
        return new Response('Invalid state parameter. CSRF attack detected.', { status: 403 });
    }

    if (!code) {
        return new Response('Missing authorization code.', { status: 400 });
    }

    try {
        // 2. Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${env.AUTH_URL}/api/oauth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json() as GoogleTokenResponse;

        if (!tokenResponse.ok) {
            console.error('Failed to fetch tokens:', tokens);
            throw new Error('Could not exchange code for tokens.');
        }

        // 3. Get user's email from Google's UserInfo endpoint
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!profileResponse.ok) {
            console.error('Failed to fetch user profile:', await profileResponse.text());
            throw new Error('Could not fetch user profile from Google.');
        }

        const profile: { email?: string; sub?: string } = await profileResponse.json();

        console.log('Profile response:', JSON.stringify(profile, null, 2));

        if (!profile?.email) {
            console.error('Profile missing email:', profile);
            throw new Error('Could not retrieve user email from Google.');
        }

        // 4. Create or update the calendar connection
        const existingConnection = await getCalendarConnection(session.user.id);

        const newConnection: CalendarConnection = {
            user_id: session.user.id as string,
            provider: 'google',
            account_email: profile.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
            connected_at: existingConnection?.connected_at || Date.now(),
            bookings_count: existingConnection?.bookings_count || 0,
        };

        console.log("Creating or updating calendar connection: ", JSON.stringify(newConnection));

        if (existingConnection) {
            await updateCalendarConnection(session.user.id, newConnection);
            console.log(`✅ Calendar connection updated for user ${session.user.id}`);
        } else {
            await createCalendarConnection(newConnection);
            console.log(`✅ Calendar connection created for user ${session.user.id}`);
        }

        // 5. Redirect back to the calendar settings page using Response redirect
        redirect('/calendar');

    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('🚨 OAuth Callback Error:', error);
        return new Response('An error occurred during the OAuth callback.', { status: 500 });
    }
} 