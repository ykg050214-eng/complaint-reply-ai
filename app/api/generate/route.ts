import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { buildSystemPrompt, buildUserPrompt, PromptInput } from '@/lib/prompt';
import { retrieveRelevantChunks } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      complaintText,
      industry,
      channel,
      tone,
      stance,
      extraInfo,
      companyName,
      customerName,
      apiKey,
      model,
      organizationId,
    } = body;

    if (!complaintText || !industry || !channel || !tone || !stance) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    // RAG: retrieve relevant knowledge chunks if organizationId is provided
    let knowledgeContext = '';
    if (organizationId) {
      try {
        const chunks = await retrieveRelevantChunks(complaintText, organizationId, openai);
        if (chunks.length > 0) {
          knowledgeContext = '\n\n【会社専用ナレッジベースより関連情報】\n' + chunks.join('\n\n---\n\n');
        }
      } catch {
        // RAG failure is non-fatal
      }
    }

    const input: PromptInput = {
      complaintText,
      industry,
      channel,
      tone,
      stance,
      extraInfo,
      companyName,
      customerName,
    };

    const systemPrompt = buildSystemPrompt() + knowledgeContext;
    const userPrompt = buildUserPrompt(input);

    const modelName = model || 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const rawContent = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIからの応答を解析できませんでした' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'AIからの応答のJSONパースに失敗しました' }, { status: 500 });
    }

    // Save to database
    const saved = await prisma.complaintResponse.create({
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
        generatedReply: parsed.reply || '',
        replyIntent: parsed.intent || '',
        improvementPoints: parsed.improvements || '',
        ngExpressions: parsed.ngExpressions || '',
        modelName,
      },
    });

    return NextResponse.json({
      id: saved.id,
      reply: parsed.reply || '',
      intent: parsed.intent || '',
      improvements: parsed.improvements || '',
      ngExpressions: parsed.ngExpressions || '',
      usedKnowledge: knowledgeContext.length > 0,
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    if (error?.status === 401) {
      return NextResponse.json({ error: 'APIキーが無効です' }, { status: 401 });
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'APIのレート制限に達しました。しばらく待ってから再試行してください' }, { status: 429 });
    }
    return NextResponse.json({ error: 'エラーが発生しました: ' + (error?.message || '不明なエラー') }, { status: 500 });
  }
}
