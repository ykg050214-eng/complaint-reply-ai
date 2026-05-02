import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, MODEL_NAME } from '@/lib/openai';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompt';
import { validateGenerateRequest } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateGenerateRequest(body);
    if (!validation.valid || !validation.data) return NextResponse.json({ error: validation.error }, { status: 400 });
    const data = validation.data;
    let client;
    try { client = getOpenAIClient(); } catch {
      return NextResponse.json({ error: 'OpenAI APIキーが設定されていません。Vercelの環境変数にOPENAI_API_KEYを設定してください。' }, { status: 500 });
    }
    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'system', content: buildSystemPrompt() }, { role: 'user', content: buildUserPrompt(data) }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'AI返信文の生成に失敗しました。' }, { status: 500 });
    let parsed: { generatedReply: string; replyIntent: string; improvementPoints: string; ngExpressions: string; };
    try { parsed = JSON.parse(content); } catch {
      return NextResponse.json({ error: 'AIの応答形式が正しくありません。' }, { status: 500 });
    }
    if (!parsed.generatedReply || !parsed.replyIntent || !parsed.improvementPoints || !parsed.ngExpressions)
      return NextResponse.json({ error: 'AIの応答に必要な情報が含まれていません。' }, { status: 500 });
    const record = await prisma.complaintResponse.create({
      data: { complaintText: data.complaintText, industry: data.industry, channel: data.channel, tone: data.tone, stance: data.stance, extraInfo: data.extraInfo || null, companyName: data.companyName || null, customerName: data.customerName || null, generatedReply: parsed.generatedReply, replyIntent: parsed.replyIntent, improvementPoints: parsed.improvementPoints, ngExpressions: parsed.ngExpressions, modelName: MODEL_NAME },
    });
    return NextResponse.json({ id: record.id, generatedReply: record.generatedReply, replyIntent: record.replyIntent, improvementPoints: record.improvementPoints, ngExpressions: record.ngExpressions, modelName: record.modelName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました。';
    return NextResponse.json({ error: `AI返信文の生成に失敗しました。${message}` }, { status: 500 });
  }
}