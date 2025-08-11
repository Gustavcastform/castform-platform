import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { auth } from '@/lib/auth';

export const runtime = 'edge';

const createContactListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsedBody = createContactListSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.format() }, { status: 400 });
    }

    const { name, description } = parsedBody.data;
    const db: D1Database = getRequestContext().env.CASTFORM_DB;

    const now = new Date().toISOString();
    const stmt = db.prepare(
      'INSERT INTO ContactLists (name, description, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, description, session.user.id, now, now);

    await stmt.run();

    // Since D1 doesn't easily return the inserted row, we'll just return success.
    // The frontend will need to refetch the lists.
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
