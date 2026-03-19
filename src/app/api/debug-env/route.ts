import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? '(not set)',
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? '(not set)',
    OPENAI_API_KEY_PREFIX: process.env.OPENAI_API_KEY?.slice(0, 15) ?? '(not set)',
  });
}
