import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { auth } from '@/lib/auth';

export const runtime = 'edge';

const updateContactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone_number: z.string().refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
    email: z.preprocess(
        (val) => (val === "" ? null : val),
        z.string().email().optional().nullable()
    ),
    age: z.preprocess(
        (val) => (val === "" || val === null ? null : Number(val)),
        z.number().optional().nullable()
    ),
    gender: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    job: z.string().optional().nullable(),
    info: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsedBody = updateContactSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.format() }, { status: 400 });
        }

        const { name, phone_number, email, age, gender, location, job, info } = parsedBody.data;
        const { contactId } = await params;

        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        const stmt = db.prepare(
            'UPDATE Contacts SET name = ?, phone_number = ?, email = ?, age = ?, gender = ?, location = ?, job = ?, info = ? WHERE id = ?'
        ).bind(name, phone_number, email, age, gender, location, job, info, contactId);

        await stmt.run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { contactId } = await params;
        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        const stmt = db.prepare('DELETE FROM Contacts WHERE id = ?').bind(contactId);
        await stmt.run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
