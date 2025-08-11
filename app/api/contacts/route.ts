import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { auth } from '@/lib/auth';

export const runtime = 'edge'

// Custom phone validation function
const validateAndFormatPhone = (phone: string): string => {
    if (!phone || phone.trim() === '') {
        throw new Error('Phone number is required');
    }

    const originalPhone = phone.trim();
    
    // Basic format check: must start with + and contain only digits after that
    if (!originalPhone.startsWith('+') || !/^\+\d+$/.test(originalPhone)) {
        throw new Error('Invalid phone number format');
    }
    
    // Validate with libphonenumber-js
    if (!isValidPhoneNumber(originalPhone)) {
        throw new Error('Invalid phone number');
    }
    
    return originalPhone; // Keep original format
};

const createContactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone_number: z.string().transform(validateAndFormatPhone),
    list_id: z.number(),
    email: z.preprocess(
        (val) => (val === "" ? null : val),
        z.string().email().optional().nullable()
    ),
    info: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');

    try {
        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        if (listId) {
            // Fetch contacts for a specific list
            const list = await db.prepare('SELECT * FROM ContactLists WHERE id = ? AND user_id = ?').bind(listId, session.user.id).first();

            if (!list) {
                return NextResponse.json({ error: 'Contact list not found or access denied' }, { status: 404 });
            }

            const { results: contacts } = await db.prepare('SELECT * FROM Contacts WHERE list_id = ?').bind(listId).all();
            return NextResponse.json(contacts);
        } else {
            // Fetch all contact lists for the user
            const { results: contactLists } = await db.prepare('SELECT * FROM ContactLists WHERE user_id = ?').bind(session.user.id).all();
            return NextResponse.json(contactLists);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsedBody = createContactSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.format() }, { status: 400 });
        }

        const { name, phone_number, list_id, email, info } = parsedBody.data;

        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        const stmt = db.prepare(
            'INSERT INTO Contacts (id, name, phone_number, list_id, email, info) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), name, phone_number, list_id, email, info);

        await stmt.run();

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
