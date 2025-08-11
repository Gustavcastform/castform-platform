import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { auth } from '@/lib/auth';
        
export const runtime = 'edge'

const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact ID is required'),
  contactListId: z.union([z.string(), z.number()]),
});

const bulkContactSchema = z.object({
    contacts: z.array(z.object({
        name: z.string().min(1, 'Name is required'),
        phone_number: z.string(),
        email: z.string().email('Valid email is required'),
        info: z.string().optional().nullable(),
    })),
    list_id: z.number(),
});

interface ProcessedContact {
    name: string;
    phone_number: string;
    email: string;
    info: string | null;
}

interface BulkImportResult {
    success: boolean;
    added: number;
    ignored: number;
    errors: string[];
    ignoredContacts: Array<{
        name: string;
        reason: string;
    }>;
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('Received body for bulk delete:', body);
    const parsedBody = bulkDeleteSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error('Zod validation error:', parsedBody.error.flatten());
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
    }

    const { contactIds, contactListId } = parsedBody.data;
    const db: D1Database = getRequestContext().env.CASTFORM_DB;

    // Ensure contacts belong to the user before deleting
    // This is a simplified check. A more robust check would join with ContactLists.
    // Verify the contact list belongs to the user
    const list = await db.prepare('SELECT id FROM ContactLists WHERE id = ? AND user_id = ?')
      .bind(contactListId, session.user.id)
      .first();

    if (!list) {
      return NextResponse.json({ success: false, error: 'Contact list not found or access denied' }, { status: 403 });
    }

    // Proceed with deletion from the verified list
    const placeholders = contactIds.map(() => '?').join(',');
    const query = `DELETE FROM contacts WHERE id IN (${placeholders}) AND list_id = ?`;
    const stmt = db.prepare(query);
    const bindings = [...contactIds, contactListId];
    const { success, meta } = await stmt.bind(...bindings).run();

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete contacts' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: placeholders.length });

  } catch (error) {
    console.error('Error deleting contacts:', error);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<BulkImportResult>> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ 
            success: false, 
            added: 0, 
            ignored: 0, 
            errors: ['Unauthorized'], 
            ignoredContacts: [] 
        }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsedBody = bulkContactSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ 
                success: false, 
                added: 0, 
                ignored: 0, 
                errors: ['Invalid input format'], 
                ignoredContacts: [] 
            }, { status: 400 });
        }

        const { contacts, list_id } = parsedBody.data;
        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        // Verify the list belongs to the user
        const list = await db.prepare('SELECT * FROM ContactLists WHERE id = ? AND user_id = ?')
            .bind(list_id, session.user.id).first();

        if (!list) {
            return NextResponse.json({ 
                success: false, 
                added: 0, 
                ignored: 0, 
                errors: ['Contact list not found or access denied'], 
                ignoredContacts: [] 
            }, { status: 404 });
        }

        const processedContacts: ProcessedContact[] = [];
        const ignoredContacts: Array<{ name: string; reason: string }> = [];
        const errors: string[] = [];

        // Process and validate each contact
        for (const contact of contacts) {
            try {
                // Validate and format phone number
                if (!contact.phone_number || contact.phone_number.trim() === '') {
                    ignoredContacts.push({
                        name: contact.name,
                        reason: 'Phone number is required'
                    });
                    continue;
                }

                // Validate phone number
                const originalPhone = contact.phone_number.trim();
                
                // Basic format check: must start with + and contain only digits after that
                if (!originalPhone.startsWith('+') || !/^\+\d+$/.test(originalPhone)) {
                    ignoredContacts.push({
                        name: contact.name,
                        reason: 'Invalid phone number format'
                    });
                    continue;
                }
                
                // Validate with libphonenumber-js
                if (!isValidPhoneNumber(originalPhone)) {
                    ignoredContacts.push({
                        name: contact.name,
                        reason: 'Invalid phone number'
                    });
                    continue;
                }
                
                const formattedPhone = originalPhone; // Keep original format

                // Validate email (required)
                if (!contact.email || contact.email.trim() === '') {
                    ignoredContacts.push({
                        name: contact.name,
                        reason: 'Email is required'
                    });
                    continue;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(contact.email)) {
                    ignoredContacts.push({
                        name: contact.name,
                        reason: 'Invalid email format'
                    });
                    continue;
                }

                const email = contact.email.trim();

                processedContacts.push({
                    name: contact.name.trim(),
                    phone_number: formattedPhone,
                    email,
                    info: contact.info?.trim() || null
                });

            } catch (error) {
                ignoredContacts.push({
                    name: contact.name,
                    reason: 'Processing error'
                });
            }
        }

        // Insert valid contacts in batch
        let addedCount = 0;
        if (processedContacts.length > 0) {
            try {
                // Prepare batch insert
                const insertPromises = processedContacts.map(contact => {
                    const stmt = db.prepare(
                        'INSERT INTO Contacts (id, name, phone_number, list_id, email, info) VALUES (?, ?, ?, ?, ?, ?)'
                    ).bind(
                        crypto.randomUUID(),
                        contact.name,
                        contact.phone_number,
                        list_id,
                        contact.email,
                        contact.info
                    );
                    return stmt.run();
                });

                await Promise.all(insertPromises);
                addedCount = processedContacts.length;
            } catch (error) {
                console.error('Error inserting contacts:', error);
                errors.push('Failed to insert some contacts');
            }
        }

        return NextResponse.json({
            success: true,
            added: addedCount,
            ignored: ignoredContacts.length,
            errors,
            ignoredContacts
        }, { status: 200 });

    } catch (error) {
        console.error('Error in bulk contact import:', error);
        return NextResponse.json({ 
            success: false, 
            added: 0, 
            ignored: 0, 
            errors: ['Internal Server Error'], 
            ignoredContacts: [] 
        }, { status: 500 });
    }
}
