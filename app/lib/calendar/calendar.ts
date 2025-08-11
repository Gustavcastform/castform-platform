import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CalendarConnection } from '../types';
import { encryptConnection, getEncryptionKey, base64ToArrayBuffer } from './helpers';
import { getDatabase } from '../utils/database';


export async function createCalendarConnection(connection: CalendarConnection): Promise<void> {
    const db = getDatabase();

    try {
        const encryptedConnection = await encryptConnection(connection);


        console.log(`creating db connection with: ${JSON.stringify(connection)}`);

        const result = await db
            .prepare(`
                INSERT INTO Calendar (user_id, email, access_token, refresh_token, provider, expires_at, connected_at, bookings_count) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                connection.user_id,
                connection.account_email,
                encryptedConnection.accessToken,
                encryptedConnection.refreshToken,
                connection.provider,
                connection.expires_at,
                connection.connected_at,
                connection.bookings_count || 0
            )
            .run();

        if (!result.success) {
            throw new Error('Failed to create calendar connection in database');
        }

        console.log(`✅ Calendar connection created for user ${connection.user_id}`);
    } catch (error) {
        console.error('💥 Calendar connection creation failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

export async function updateCalendarConnection(userId: string, connection: CalendarConnection): Promise<void> {
    const db = getDatabase();

    try {
        const encryptedConnection = await encryptConnection(connection);

        const result = await db
            .prepare(`
                UPDATE Calendar 
                SET email = ?, access_token = ?, refresh_token = ?, provider = ?, expires_at = ?, connected_at = ?, bookings_count = ?
                WHERE user_id = ?
            `)
            .bind(
                connection.account_email,
                encryptedConnection.accessToken,
                encryptedConnection.refreshToken,
                connection.provider,
                connection.expires_at,
                connection.connected_at,
                connection.bookings_count || 0,
                userId
            )
            .run();

        if (!result.success) {
            throw new Error('Failed to update calendar connection in database');
        }

        console.log(`✅ Calendar connection updated for user ${userId}`);
    } catch (error) {
        console.error('💥 Calendar connection update failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

export async function getCalendarConnection(userId: string): Promise<CalendarConnection | null> {
    const db = getDatabase();

    try {
        const connection = await db
            .prepare('SELECT * FROM Calendar WHERE user_id = ?')
            .bind(userId)
            .first();

        if (!connection) {
            return null;
        }

        // Decrypt the tokens using the existing decryption logic
        const { env } = getRequestContext();
        const encryptionKey = await getEncryptionKey(env.ENCRYPTION_KEY);
        const decoder = new TextDecoder();

        const [ivBase64Access, encryptedBase64Access] = (connection.access_token as string).split(':');
        const ivAccess = base64ToArrayBuffer(ivBase64Access);
        const decryptedAccessToken = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivAccess },
            encryptionKey,
            base64ToArrayBuffer(encryptedBase64Access)
        );

        const [ivBase64Refresh, encryptedBase64Refresh] = (connection.refresh_token as string).split(':');
        const ivRefresh = base64ToArrayBuffer(ivBase64Refresh);
        const decryptedRefreshToken = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivRefresh },
            encryptionKey,
            base64ToArrayBuffer(encryptedBase64Refresh)
        );

        const result: CalendarConnection = {
            id: connection.id as number,
            account_email: connection.email as string,
            user_id: connection.user_id as string,
            access_token: decoder.decode(decryptedAccessToken),
            refresh_token: decoder.decode(decryptedRefreshToken),
            provider: connection.provider as 'google',
            expires_at: connection.expires_at as number,
            connected_at: connection.connected_at as number,
            bookings_count: connection.bookings_count as number || 0,
        };

        return result;
    } catch (error) {
        console.error('🔥 Failed to fetch calendar connection:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

export async function deleteCalendarConnection(userId: string): Promise<void> {
    const db = getDatabase();

    try {
        const result = await db
            .prepare('DELETE FROM Calendar WHERE user_id = ?')
            .bind(userId)
            .run();

        console.log(`🗑️ Calendar connection deleted for user ${userId}`);
    } catch (error) {
        console.error('💥 Calendar connection deletion failed:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}