import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    console.log('[openaiClient] init — baseURL:', baseURL, 'keyPrefix:', process.env.OPENAI_API_KEY?.slice(0, 12) ?? 'MISSING');
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL,
    });
  }
  return client;
}

export function getModel(): string {
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  console.log('[openaiClient] model:', model);
  return model;
}
