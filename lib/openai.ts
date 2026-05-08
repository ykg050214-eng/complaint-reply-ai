import Anthropic from '@anthropic-ai/sdk';

export const MODEL_NAME = 'claude-haiku-4-5-20251001';

export function getAnthropicClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic APIキーが設定されていません。');
  return new Anthropic({ apiKey: key });
}
