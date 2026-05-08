import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { retrieveRelevantChunks } from '@/lib/rag';

function buildSystemPrompt(knowledgeContext: string): string {
  return `あなたはプロのカスタマーサポート担当者です。クレームに対して誠実で丁寧な返信文を作成してください。

返答はJSON形式で、以下のキーを含んでください：
- generatedReply: 返信文（そのままコピーできる完全な文章）
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

    // キー優先順位: ユーザー個人キー > 組織キー > 環境変数
    let apiKey = process.env.GEMINI_API_KEY;
    if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (org?.geminiApiKey) apiKey = org.geminiApiKey.trim();
    }
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as { id: string }).id;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { geminiApiKey: true } });
      if (user?.geminiApiKey) apiKey = user.geminiApiKey.trim();
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini APIキーが設定されていません。設定ページで個人のAPIキーを入力してください。' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const MODEL_NAME = 'gemini-1.5-flash';

    let knowledgeContext = '';
    if (organizationId) {
      try {
        const chunks = await retrieveRelevantChunks(complaintText, organizationId, apiKey);
        if (chunks.length > 0) knowledgeContext = chunks.join('\n\n---\n\n');
      } catch {}
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const prompt = `${buildSystemPrompt(knowledgeContext)}\n\n${buildUserPrompt(body)}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw);

    await getServerSession(authOptions);
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
