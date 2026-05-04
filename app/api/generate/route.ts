import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { retrieveRelevantChunks } from '@/lib/rag';

function buildSystemPrompt(knowledgeContext: string): string {
  return `あなたはプロのカスタマーサポート担当者です。クレームに対して誠実で丁寧な返信文を作成してください。

返答はJSON形式で、以下のキーを含めてください：
- generatedReply: 返信文（そのままコピペできる完全な文章）
- replyIntent: この返信の意図・ポイント（100文字以内）
- improvementPoints: 改善できる点・注意事項（100文字以内）
- ngExpressions: 使ってはいけない表現例（50文字以内）
${knowledgeContext ? `
【会社専用ナレッジベース】
以下の会社情報を参考にして、会社のポリシーや対応方針に沿った返信を作成してください：

${knowledgeContext}

※上記情報はこのアプリ内にのみ保存された会社専用情報です。` : ''}`;
}

function buildUserPrompt(body: any): string {
  return `以下のクレームに返信してください：

【クレーム内容】
${body.complaintText}

【設定】
- 業種: ${body.industry}
- 返信媒体: ${body.channel}
- トーン: ${body.tone}
- 返信の強さ: ${body.stance}
${body.companyName ? `- 会社名: ${body.companyName}` : ''}
${body.customerName ? `- 相手の呼び方: ${body.customerName}` : ''}
${body.extraInfo ? `- 補足情報: ${body.extraInfo}` : ''}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintText, industry, channel, tone, stance, extraInfo, companyName, customerName, organizationId } = body;

    if (!complaintText?.trim()) return NextResponse.json({ error: 'クレーム内容を入力してください' }, { status: 400 });
    if (!industry?.trim()) return NextResponse.json({ error: '業種を選択してください' }, { status: 400 });
    if (!channel?.trim()) return NextResponse.json({ error: '返信媒体を選択してください' }, { status: 400 });
    if (!tone?.trim()) return NextResponse.json({ error: 'トーンを選択してください' }, { status: 400 });
    if (!stance?.trim()) return NextResponse.json({ error: '返信の強さを選択してください' }, { status: 400 });

    // Determine which API key to use
    let apiKey = process.env.OPENAI_API_KEY;
    if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (org?.openaiApiKey) {
        apiKey = org.openaiApiKey;
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI APIキーが設定されていません。ナレッジ管理画面でAPIキーを設定してください。' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    // RAG: get relevant knowledge chunks
    let knowledgeContext = '';
    if (organizationId) {
      try {
        const chunks = await retrieveRelevantChunks(complaintText, organizationId, openai);
        if (chunks.length > 0) {
          knowledgeContext = chunks.join('\n\n---\n\n');
        }
      } catch {}
    }

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(knowledgeContext) },
        { role: 'user', content: buildUserPrompt(body) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    const session = await getServerSession(authOptions);
    const record = await prisma.complaintResponse.create({
      data: {
        organizationId: organizationId || null,
        complaintText,
        industry,
        channel,
        tone,
        stance,
        extraInfo: extraInfo || null,
        companyName: companyName || null,
        customerName: customerName || null,
        generatedReply: parsed.generatedReply || '',
        replyIntent: parsed.replyIntent || '',
        improvementPoints: parsed.improvementPoints || '',
        ngExpressions: parsed.ngExpressions || '',
        modelName: MODEL_NAME,
      },
    });

    return NextResponse.json({
      id: record.id,
      generatedReply: record.generatedReply,
      replyIntent: record.replyIntent,
      improvementPoints: record.improvementPoints,
      ngExpressions: record.ngExpressions,
      modelName: MODEL_NAME
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AI返信文の生成に失敗しました。' + (error?.message || '') }, { status: 500 });
  }
}
