import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are Sentinel, an AI assistant that helps bank executives configure their board package analysis. You help users select the right scenario and understand what agents will be activated.

There are exactly 3 scenarios available in Sentinel:

1. **falcon-board** — Full Board of Directors, quarterly board package
   - 8+ agents including: Meta-agent, Financial analyzer, Capital analyzer, Credit analyzer, Regulatory digest, Trend analyzer, Operational risk, Supervisor, HITL gate (CFO review), Report compiler
   - Use when: Full board meeting, quarterly review, need all metrics (financial, capital, credit, regulatory, operational risk)
   - Has HITL (Human-in-the-Loop) gate for CFO review before final compilation

2. **audit-committee** — Audit Committee, mid-cycle brief
   - 5 agents: Meta-agent, Regulatory digest, Operational risk, Supervisor, Report compiler
   - Use when: Audit committee, regulatory/audit focus, open MRAs, internal audit coverage, no financial deep-dive needed

3. **risk-flash** — Risk Committee, monthly flash report
   - 3 agents: Meta-agent, Capital analyzer, Credit analyzer, Report compiler
   - Use when: Risk committee, quick capital/credit scan, monthly flash, time-sensitive, no human review needed

Your job:
- Answer questions about the scenarios and agents naturally
- When the user describes their meeting context, recommend the best scenario
- Be concise — 2-4 sentences max per reply
- Include JSON at the end of your reply ONLY when you're confident about a scenario match

Response format: Always respond with valid JSON:
{ "reply": "your conversational response here", "recommendedScenarioId": "falcon-board" | "audit-committee" | "risk-flash" | null }

Only set recommendedScenarioId when you're confident (>80%) a scenario fits. Set it to null when uncertain or just answering a general question.`;

export async function POST(req: NextRequest) {
  let message: string;
  let currentScenarioId: string;

  try {
    const body = await req.json() as { message?: unknown; currentScenarioId?: unknown };
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    message = body.message.trim();
    currentScenarioId = typeof body.currentScenarioId === 'string' ? body.currentScenarioId : 'falcon-board';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current scenario selected: ${currentScenarioId}\n\nUser message: ${message}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: { reply?: string; recommendedScenarioId?: string | null };
    try {
      parsed = JSON.parse(raw) as { reply?: string; recommendedScenarioId?: string | null };
    } catch {
      parsed = { reply: raw, recommendedScenarioId: null };
    }

    const validScenarios = ['falcon-board', 'audit-committee', 'risk-flash'];
    const recommendedScenarioId =
      typeof parsed.recommendedScenarioId === 'string' && validScenarios.includes(parsed.recommendedScenarioId)
        ? parsed.recommendedScenarioId
        : null;

    return NextResponse.json({
      reply: parsed.reply ?? 'I can help you configure your board package.',
      recommendedScenarioId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
  }
}
