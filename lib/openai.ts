import { GoogleGenerativeAI } from '@google/generative-ai';
export const MODEL_NAME = 'gemini-1.5-flash';
export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません。');
  return new GoogleGenerativeAI(apiKey);
}
