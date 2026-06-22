import { NextResponse } from 'next/server';
import OpenAI from 'openai';

let openaiClient = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
    });
  }
  return openaiClient;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });

    return NextResponse.json({
      embedding: response.data[0].embedding,
    });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}