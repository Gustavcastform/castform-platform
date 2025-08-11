import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

async function fetchAndCleanWebsite(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.statusText}`);
        }
        const html = await response.text();
        // A very basic way to "clean" HTML. A real implementation would use a library like Cheerio.
        const text = html.replace(/<style[^>]*>.*?<\/style>/gs, '')
            .replace(/<script[^>]*>.*?<\/script>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return text.substring(0, 15000); // Limit to a reasonable length for the model
    } catch (error) {
        console.error('Error fetching website content:', error);
        throw new Error('Could not retrieve website content.');
    }
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json() as { url: string };
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const websiteText = await fetchAndCleanWebsite(url);
        const { env } = getRequestContext();
        const geminiApiKey = env.GEMINI_API_KEY;

        const prompt = `Please provide a detailed and informative summary of the following website content. Focus on the key services, products, mission, and any other relevant information that would be useful for a customer service AI agent. The summary should be well-structured, easy to understand, and comprehensive. Website content: "${websiteText}"`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json({ error: 'Failed to generate summary from Gemini', details: errorData }, { status: geminiResponse.status });
        }

        const geminiData = await geminiResponse.json() as { candidates: { content: { parts: { text: string }[] } }[] };
        const summary = geminiData.candidates[0].content.parts[0].text;

        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error('🔥 Summarization Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
} 