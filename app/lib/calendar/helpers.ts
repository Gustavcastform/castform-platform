import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CalendarConnection } from '../types';

const ALGORITHM = { name: 'AES-GCM', length: 256 };

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function hexToaArrayBuffer(hex: string): Uint8Array {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i+=2) {
        arr[i/2] = parseInt(hex.substring(i, i+2), 16);
    }
    return arr;
}

export async function encryptConnection(connection: CalendarConnection): Promise<Omit<CalendarConnection, 'accessToken' | 'refreshToken'> & { accessToken: string, refreshToken: string }> {
    const { env } = getRequestContext();
    const encryptionKey = await getEncryptionKey(env.ENCRYPTION_KEY);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptedAccessToken = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        encoder.encode(connection.access_token)
    );

    const encryptedRefreshToken = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        encoder.encode(connection.refresh_token)
    );

    return {
        ...connection,
        accessToken: `${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(encryptedAccessToken)}`,
        refreshToken: `${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(encryptedRefreshToken)}`,
    };
}


export async function getEncryptionKey(secret: string): Promise<CryptoKey> {
    if (!secret) {
        throw new Error('ENCRYPTION_KEY is not set in the environment variables.');
    }
    const keyData = hexToaArrayBuffer(secret);
    return crypto.subtle.importKey(
        'raw',
        keyData,
        ALGORITHM,
        false,
        ['encrypt', 'decrypt']
    );
}