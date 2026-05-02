import OpenAI from 'openai';
export const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI APIキーが設定されていません。');
  return new OpenAI({ apiKey });
}