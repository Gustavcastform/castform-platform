import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { auth } from '@/lib/auth';

export const runtime = 'edge';

const updateContactListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listId } = await params;
  if (!listId || isNaN(parseInt(listId))) {
    return NextResponse.json({ error: 'Invalid List ID' }, { status: 400 });
  }

  try {
    const db: D1Database = getRequestContext().env.CASTFORM_DB;

    // Verify the list belongs to the user
    const existingList = await db.prepare('SELECT id FROM ContactLists WHERE id = ? AND user_id = ?')
      .bind(listId, session.user.id)
      .first();

    if (!existingList) {
      return NextResponse.json({ error: 'Contact list not found or access denied' }, { status: 404 });
    }

    // D1 doesn't support cascading deletes, so we delete contacts first
    await db.prepare('DELETE FROM Contacts WHERE list_id = ?').bind(listId).run();

    // Then delete the list
    await db.prepare('DELETE FROM ContactLists WHERE id = ? AND user_id = ?').bind(listId, session.user.id).run();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting contact list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listId } = await params;
  if (!listId || isNaN(parseInt(listId))) {
    return NextResponse.json({ error: 'Invalid List ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsedBody = updateContactListSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.format() }, { status: 400 });
    }

    const { name, description } = parsedBody.data;
    const db: D1Database = getRequestContext().env.CASTFORM_DB;

    // First, verify the list belongs to the user before updating
    const existingList = await db.prepare('SELECT id FROM ContactLists WHERE id = ? AND user_id = ?')
      .bind(listId, session.user.id)
      .first();

    if (!existingList) {
      return NextResponse.json({ error: 'Contact list not found or access denied' }, { status: 404 });
    }

    // Update the contact list
    const stmt = db.prepare(
      'UPDATE ContactLists SET name = ?, description = ? WHERE id = ? AND user_id = ?'
    ).bind(name, description, listId, session.user.id);

    await stmt.run();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating contact list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
