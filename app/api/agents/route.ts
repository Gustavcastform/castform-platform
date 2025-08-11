import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getCalendarConnection } from '@/lib/calendar/calendar';

export const runtime = 'edge';

const createAgentSchema = z.object({
    tool: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    agent_goal: z.string().min(1, 'Agent goal is required'),
    website_url: z.string().optional(),
    website_summary: z.string().optional(),
    tone: z.string(),
    pacing: z.string(),
    transcriber_provider: z.string(),
    transcriber_model: z.string(),
    model_provider: z.string(),
    model_name: z.string(),
    voice_provider: z.string(),
    voice_id: z.string(),
    first_message: z.string().optional(),
});

function constructPrompt(data: any, summary?: string): string {
    let prompt = `**Agent Goal:**\n${data.agent_goal}\n\n`;

    if (data.website_summary) {
        prompt += `**Website Summary (Knowledge Base):**\n${data.website_summary}\n\n`;
    }

    prompt += `**Tone and Pacing:**\nYou should adopt a ${data.tone} tone and maintain a ${data.pacing} pace throughout the conversation.`;

    prompt += `**Contact information** Here's some of customer information some of maybe missing 
    name: {{name}}
    phone number: {{phone_number}}
    email: {{email}}
    address: {{address}}
    job: {{job}}
    extra info: {{info}}
    gender: {{gender}}
    age: {{age}}
    `;

    return prompt;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const email = session.user.email;

    try {
        const body = await req.json();
        const parsedBody = createAgentSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
        }

        const {
            name,
            description,
            transcriber_provider,
            transcriber_model,
            model_provider,
            model_name,
            voice_provider,
            voice_id,
            first_message,
            agent_goal,
            website_url,
            website_summary,
            tone,
            pacing,
        } = parsedBody.data;

        let finalPrompt = constructPrompt(parsedBody.data);
        let vapiToolId: string | null = null;

        if (parsedBody.data.tool === 'book_meeting') {
            const calendarConnection = await getCalendarConnection(userId);
            if (!calendarConnection) {
                return NextResponse.json({ error: 'You must connect a calendar before creating an agent with the booking tool.' }, { status: 400 });
            }

            const bookingPrompt = `You are a professional scheduling assistant. Your goal is to efficiently book appointment. You must collect a suitable date and time. Today's date is {{now}}. If the tool fails, apologize and explain that you'll need to try again, don't mention any links or websites about booking a meeting, also confirm the time zone for the user.`;
            finalPrompt = `${bookingPrompt}\n\n${finalPrompt}`;

            const toolPayload = {
                name: 'bookMeeting',
                type: 'apiRequest' as const,
                url: `${process.env.API_BASE_URL}/api/book-meeting?userId=${userId}`,
                method: 'POST' as const,
                body: {
                    type: 'object' as const,
                    properties: {
                        dateTime: {
                            type: 'string' as const,
                            description: 'The date and time for the appointment in ISO format. e.g. 2024-08-05T14:30:00Z',
                        },
                        attendeeEmail: {
                            type: 'string' as const,
                            description: 'The email address of the person to book the meeting with. This should be the user you are talking to.',
                        },
                        description: {
                            type: 'string' as const,
                            description: 'A brief summary or title for the meeting.'
                        }
                    },
                    required: ['dateTime', 'attendeeEmail', 'description'],
                },
            };

            const vapiToolResponse = await fetch('https://api.vapi.ai/tool', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                },
                body: JSON.stringify(toolPayload),
            });

            if (!vapiToolResponse.ok) {
                const errorData = await vapiToolResponse.json();
                console.error('💥 Vapi Tool Creation Error:', errorData);
                return NextResponse.json({ error: 'Failed to create Vapi tool', details: errorData }, { status: vapiToolResponse.status });
            }

            const vapiTool: { id: string } = await vapiToolResponse.json();
            vapiToolId = vapiTool.id;
        }

        const vapiPayload: any = {
            transcriber: {
                provider: transcriber_provider,
                model: transcriber_model,
            },
            model: {
                provider: model_provider,
                model: model_name,
                messages: [{ role: 'system', content: finalPrompt }],
                ...(vapiToolId && { toolIds: [vapiToolId] }),
            },
            voice: {
                provider: voice_provider,
                voiceId: voice_id,
            },
            name: name,
            firstMessage: first_message,
        };

        const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
            },
            body: JSON.stringify(vapiPayload),
        });

        if (!vapiResponse.ok) {
            const errorData = await vapiResponse.json();
            console.error('Vapi API Error:', errorData);
            return NextResponse.json({ error: 'Failed to create assistant with Vapi', details: errorData }, { status: vapiResponse.status });
        }

        const vapiData = await vapiResponse.json() as { id: string };
        const vapiAssistantId = vapiData.id;

        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        console.log("Creating agent with data:", parsedBody.data);
        console.log("Constructed prompt:", finalPrompt);

        await db
            .prepare(
                `INSERT INTO Agents (user_id, id, name, description, prompt, agent_goal, website_url, website_summary, tone, pacing, transcriber_provider, transcriber_model, model_provider, model_name, voice_provider, voice_id, first_message, tool, vapi_tool_id)
                 VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
                userId,
                vapiAssistantId,
                name,
                description || null,
                finalPrompt,
                agent_goal,
                website_url || null,
                website_summary || null,
                tone,
                pacing,
                transcriber_provider,
                transcriber_model,
                model_provider,
                model_name,
                voice_provider,
                voice_id,
                first_message || null,
                parsedBody.data.tool || null,
                vapiToolId
            )
            .run();

        console.log(`🚀 Agent "${name}" created faster than a caffeinated cheetah!`);

        const newAgent = await db.prepare('SELECT * FROM Agents WHERE id = ?').bind(vapiAssistantId).first();

        return NextResponse.json({ success: true, agent: newAgent });
    } catch (error) {
        console.error('🔥 Houston, we have a problem creating an agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const db: D1Database = getRequestContext().env.CASTFORM_DB;
        const { results } = await db
            .prepare('SELECT * FROM Agents WHERE user_id = ? ORDER BY created_at DESC')
            .bind(userId)
            .all();

        return NextResponse.json(results);
    } catch (error) {
        console.error('🔥 Failed to fetch agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
        return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    try {
        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        const agent = await db.prepare('SELECT id FROM Agents WHERE id = ? AND user_id = ?').bind(agentId, userId).first<{ id: string }>();

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${agent.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
            },
        });

        if (!vapiResponse.ok) {
            const errorData = await vapiResponse.json();
            console.error('Vapi API Error:', errorData);
            return NextResponse.json({ error: 'Failed to delete assistant from Vapi', details: errorData }, { status: vapiResponse.status });
        }

        await db.prepare('DELETE FROM Agents WHERE id = ? AND user_id = ?').bind(agentId, userId).run();

        console.log(`🗑️ Agent with ID ${agentId} was deleted. Nothing personal.`);

        return NextResponse.json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('🔥 Failed to delete agent:', error);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }
}

const updateAgentSchema = createAgentSchema.partial().extend({
    id: z.string(),
});

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const email = session.user.email;
    const VAPI_PRIVATE_KEY = getRequestContext().env.VAPI_PRIVATE_KEY as string;

    try {
        const body = await req.json();
        const parsedBody = updateAgentSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
        }

        const { id: agentId, ...updateData } = parsedBody.data;
        console.log("Updating agent with data:", updateData);
        const db: D1Database = getRequestContext().env.CASTFORM_DB;

        const currentAgent = await db.prepare('SELECT * FROM Agents WHERE id = ? AND user_id = ?').bind(agentId, userId).first<any>();

        if (!currentAgent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const finalUpdateData = { ...currentAgent, ...updateData };
        console.log("Final merged agent data for update:", finalUpdateData);
        let finalPrompt = constructPrompt(finalUpdateData);
        let vapiToolId = currentAgent.vapi_tool_id;
        let toolIds = vapiToolId ? [vapiToolId] : [];

        if (finalUpdateData.tool === 'book_meeting') {
            const calendarConnection = await getCalendarConnection(userId);
            if (!calendarConnection) {
                return NextResponse.json({ error: 'You must connect a calendar before enabling the booking tool for an agent.' }, { status: 400 });
            }
        }

        const toolChanged = currentAgent.tool !== updateData.tool;

        if (toolChanged) {
            // Tool removed
            if (currentAgent.vapi_tool_id && updateData.tool !== 'book_meeting') {
                await fetch(`https://api.vapi.ai/tool/${currentAgent.vapi_tool_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` },
                });
                vapiToolId = null;
                toolIds = [];
            }
            // Tool added
            else if (!currentAgent.vapi_tool_id && updateData.tool === 'book_meeting') {
                const toolPayload = {
                    name: 'bookMeeting',
                    type: 'apiRequest' as const,
                    url: `${process.env.API_BASE_URL}/api/book-meeting?userId=${userId}`,
                    method: 'POST' as const,
                    body: {
                        type: 'object' as const,
                        properties: {
                            dateTime: {
                                type: 'string' as const,
                                description: 'The date and time for the appointment in ISO format. e.g. 2024-08-05T14:30:00Z',
                            },
                            attendeeEmail: {
                                type: 'string' as const,
                                description: 'The email address of the person to book the meeting with. This should be the user you are talking to.',
                            },
                            description: {
                                type: 'string' as const,
                                description: 'A brief summary or title for the meeting.'
                            }
                        },
                        required: ['dateTime', 'attendeeEmail', 'description'],
                    },
                };
                const vapiToolResponse = await fetch('https://api.vapi.ai/tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` },
                    body: JSON.stringify(toolPayload),
                });
                if (!vapiToolResponse.ok) {
                    const errorData = await vapiToolResponse.json();
                    return NextResponse.json({ error: 'Failed to create Vapi tool', details: errorData }, { status: vapiToolResponse.status });
                }
                const vapiTool: { id: string } = await vapiToolResponse.json();
                vapiToolId = vapiTool.id;
                toolIds = [vapiToolId];
            }
        }

        if (finalUpdateData.tool === 'book_meeting') {
            const bookingPrompt = `You are a professional scheduling assistant. Your goal is to efficiently book appointments by collecting the date and time for the meeting. Today's date is {{now}}. If the tool fails, apologize and explain that you'll need to try again.`;
            finalPrompt = `${bookingPrompt}\n\n${finalPrompt}`;
        }

        const vapiPayload: any = {
            name: finalUpdateData.name,
            model: {
                provider: finalUpdateData.model_provider,
                model: finalUpdateData.model_name,
                messages: [{ role: 'system', content: finalPrompt }],
                toolIds: toolIds,
            },
            voice: {
                provider: finalUpdateData.voice_provider,
                voiceId: finalUpdateData.voice_id,
            },
            transcriber: {
                provider: finalUpdateData.transcriber_provider,
                model: finalUpdateData.transcriber_model,
            },
            firstMessage: finalUpdateData.first_message,
        };

        const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${currentAgent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` },
            body: JSON.stringify(vapiPayload),
        });

        if (!vapiResponse.ok) {
            const errorData = await vapiResponse.json();
            console.log(errorData)
            return NextResponse.json({ error: 'Failed to update assistant with Vapi', details: errorData }, { status: vapiResponse.status });
        }

        const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        await db.prepare(`UPDATE Agents SET ${setClauses}, prompt = ?, vapi_tool_id = ? WHERE id = ? AND user_id = ?`).bind(...values, finalPrompt, vapiToolId, agentId, userId).run();

        return NextResponse.json({ success: true, message: 'Agent updated successfully' });
    } catch (error) {
        console.error('Failed to update agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}