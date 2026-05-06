import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { retrieveRelevantChunks } from '@/lib/rag';

function buildSystemPrompt(knowledgeContext: string): string {
  return `ããªãã¯ãã­ã®ã«ã¹ã¿ãã¼ãµãã¼ãæå½èã§ããã¯ã¬ã¼ã ã«å¯¾ãã¦èª å®ã§ä¸å¯§ãªè¿ä¿¡æãä½æãã¦ãã ããã

è¿ç­ã¯JSONå½¢å¼ã§ãä»¥ä¸ã®ã­ã¼ãå«ãã¦ãã ããï¼
- generatedReply: è¿ä¿¡æï¼ãã®ã¾ã¾ã³ããã§ããå®å¨ãªæç« ï¼
- replyIntent: ãã®è¿ä¿¡ã®æå³ã»ãã¤ã³ãï¼100æå­ä»¥åï¼
- improvementPoints: æ¹åã§ããç¹ã»æ³¨æäºé ï¼100æå­ä»¥åï¼
- ngExpressions: ä½¿ã£ã¦ã¯ãããªãè¡¨ç¾ä¾ï¼50æå­ä»¥åï¼
${knowledgeContext ? `
ãä¼ç¤¾å°ç¨ãã¬ãã¸ãã¼ã¹ã
ä»¥ä¸ã®ä¼ç¤¾æå ±ãåèã«ãã¦ãä¼ç¤¾ã®ããªã·ã¼ãå¯¾å¿æ¹éã«æ²¿ã£ãè¿ä¿¡ãä½æãã¦ãã ããï¼

${knowledgeContext}

â»ä¸è¨æå ±ã¯ãã®ã¢ããªåã«ã®ã¿ä¿å­ãããä¼ç¤¾å°ç¨æå ±ã§ãã` : ''}`;
}

function buildUserPrompt(body: any): string {
  return `ä»¥ä¸ã®ã¯ã¬ã¼ã ã«è¿ä¿¡ãã¦ãã ããï¼

ãã¯ã¬ã¼ã åå®¹ã
${body.complaintText}

ãè¨­å®ã
- æ¥­ç¨®: ${body.industry}
- è¿ä¿¡åªä½: ${body.channel}
- ãã¼ã³: ${body.tone}
- è¿ä¿¡ã®å¼·ã: ${body.stance}
${body.companyName ? `- ä¼ç¤¾å: ${body.companyName}` : ''}
${body.customerName ? `- ç¸æã®å¼ã³æ¹: ${body.customerName}` : ''}
${body.extraInfo ? `- è£è¶³æå ±: ${body.extraInfo}` : ''}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintText, industry, channel, tone, stance, extraInfo, companyName, customerName, organizationId } = body;

    if (!complaintText?.trim()) return NextResponse.json({ error: 'ã¯ã¬ã¼ã åå®¹ãå¥åãã¦ãã ãã' }, { status: 400 });
    if (!industry?.trim()) return NextResponse.json({ error: 'æ¥­ç¨®ãé¸æãã¦ãã ãã' }, { status: 400 });
    if (!channel?.trim()) return NextResponse.json({ error: 'è¿ä¿¡åªä½ãé¸æãã¦ãã ãã' }, { status: 400 });
    if (!tone?.trim()) return NextResponse.json({ error: 'ãã¼ã³ãé¸æãã¦ãã ãã' }, { status: 400 });
    if (!stance?.trim()) return NextResponse.json({ error: 'è¿ä¿¡ã®å¼·ããé¸æãã¦ãã ãã' }, { status: 400 });

    // Determine which API key to use
    let apiKey = process.env.GEMINI_API_KEY;
    if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (org?.geminiApiKey) {
        apiKey = org.geminiApiKey.trim();
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini APIã­ã¼ãè¨­å®ããã¦ãã¾ããããã¬ãã¸ç®¡çç»é¢ã§APIã­ã¼ãè¨­å®ãã¦ãã ããã' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const MODEL_NAME = 'gemini-2.0-flash';

    // RAG: get relevant knowledge chunks
    let knowledgeContext = '';
    if (organizationId) {
      try {
        const chunks = await retrieveRelevantChunks(complaintText, organizationId, apiKey);
        if (chunks.length > 0) {
          knowledgeContext = chunks.join('\n\n---\n\n');
        }
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
    return NextResponse.json({ error: 'AIè¿ä¿¡æã®çæã«å¤±æãã¾ããã' + (error?.message || '') }, { status: 500 });
  }
}
