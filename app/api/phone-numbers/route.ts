import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { auth } from '@/lib/auth';
import type { PhoneNumber } from '@/lib/types';

interface CreatePhoneNumberRequest {
  name: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  number: string; // E.164 format
}

interface VapiCredentialResponse {
    id: string;
    // other fields...
}

interface VapiPhoneNumberResponse {
    id: string;
    number: string;
    // other fields...
}

export const runtime = 'edge';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { env } = getRequestContext();
    const db = env.CASTFORM_DB;
    const result = await db.prepare('SELECT * FROM phone_numbers WHERE user_id = ?').bind(userId).first<PhoneNumber>();

    if (result) {
      return NextResponse.json({ id: result.vapi_phone_number_id, name: result.name, number: result.number });
    } else {
      return NextResponse.json({ error: 'No phone number connected' }, { status: 404 });
    }
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { env } = getRequestContext();
    const db = env.CASTFORM_DB;
    const vapiPrivateKey = env.VAPI_PRIVATE_KEY;

    const existingNumber = await db.prepare('SELECT id FROM phone_numbers WHERE user_id = ?').bind(userId).first();
    if (existingNumber) {
      return NextResponse.json({ error: 'A phone number is already connected.' }, { status: 409 });
    }

    const { name, twilioAccountSid, twilioAuthToken, number } = await req.json() as CreatePhoneNumberRequest;
    if (!name || !twilioAccountSid || !twilioAuthToken || !number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vapiResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vapiPrivateKey}`,
      },
      body: JSON.stringify({
        provider: 'twilio',
        twilioAccountSid: twilioAccountSid,
        twilioAuthToken: twilioAuthToken,
        number: number,
      }),
    });

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Failed to connect phone number via Vapi:', errorData);
      return NextResponse.json({ error: 'Failed to connect phone number via Vapi', details: errorData }, { status: vapiResponse.status });
    }

    const vapiPhoneNumber = await vapiResponse.json() as VapiPhoneNumberResponse;

    await db.prepare(
      'INSERT INTO phone_numbers (user_id, vapi_phone_number_id, name, number) VALUES (?, ?, ?, ?)'
    ).bind(userId, vapiPhoneNumber.id, name, vapiPhoneNumber.number).run();

    return NextResponse.json({ id: vapiPhoneNumber.id, name, number: vapiPhoneNumber.number });

  } catch (error) {
    console.error('Error connecting phone number:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { env } = getRequestContext();
    const db = env.CASTFORM_DB;
    const vapiPrivateKey = env.VAPI_PRIVATE_KEY;

    const phoneNumber = await db.prepare('SELECT vapi_phone_number_id FROM phone_numbers WHERE user_id = ?').bind(userId).first<{ vapi_phone_number_id: string }>();
    if (!phoneNumber) {
      return NextResponse.json({ error: 'No phone number to disconnect' }, { status: 404 });
    }

    
    // We only need to delete from Vapi. Our DB record is deleted after.
    const vapiResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneNumber.vapi_phone_number_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${vapiPrivateKey}` },
    });

    if(vapiResponse.status === 404){
      await db.prepare('DELETE FROM phone_numbers WHERE user_id = ?').bind(userId).run();
      return NextResponse.json({ error: 'Phone number connection lost from vapi' }, { status: 404 });
    }

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Failed to disconnect phone number via Vapi:', errorData);
      return NextResponse.json({ error: 'Failed to disconnect phone number via Vapi', details: errorData }, { status: vapiResponse.status });
    }


    await db.prepare('DELETE FROM phone_numbers WHERE user_id = ?').bind(userId).run();

    return NextResponse.json({ message: 'Phone number disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting phone number:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
