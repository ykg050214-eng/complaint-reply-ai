import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter(c => c.length > 50);
}

async function embedChunks(chunks: string[], genAI: GoogleGenerativeAI): Promise<number[][]> {
  const embModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const result = await embModel.embedContent(chunk);
      return result.embedding.values;
    })
  );
  return embeddings;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('organizationId');
  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: (session!.user as any).id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const docs = await prisma.knowledgeDocument.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, type: true, status: true, createdAt: true, sourceUrl: true },
  });
  return NextResponse.json(docs);
}

async function ocrPdfWithGemini(pdfBuffer: Buffer, geminiApiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const base64Pdf = pdfBuffer.toString('base64');
  const result = await model.generateContent([
    { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } },
    'このPDFに書かれているテキストをすべて正確に抽出してください。書式や改行はできるだけ保持してください。テキストのみを返し、説明は不要です。',
  ]);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const organizationId = formData.get('organizationId') as string;
  const type = formData.get('type') as string;

  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: (session!.user as any).id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let content = '';
  let name = '';
  let sourceUrl: string | undefined;

  if (type === 'url') {
    const url = formData.get('url') as string;
    sourceUrl = url;
    name = url;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    content = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000);
  } else {
    const file = formData.get('file') as File;
    name = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === 'txt') {
      content = buffer.toString('utf-8');
    } else if (type === 'pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        content = data.text || '';
        if (!content || content.trim().length < 10) {
          const org = await prisma.organization.findUnique({ where: { id: organizationId } });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orgApiKey = (org as any)?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY;
          if (orgApiKey) {
            try {
              content = await ocrPdfWithGemini(buffer, orgApiKey);
              if (!content || content.trim().length < 10) {
                return NextResponse.json(
                  { error: 'PDFからテキストを抽出できませんでした。テキストベースのPDFか、読み取り可能なスキャンPDFをご使用ください。' },
                  { status: 400 }
                );
              }
            } catch (ocrErr) {
              return NextResponse.json(
                { error: 'OCR処理に失敗しました: ' + (ocrErr instanceof Error ? ocrErr.message : String(ocrErr)) },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'APIキーが設定されていないため、画像PDFのOCRができません。設定ページでAPIキーを設定してください。' },
              { status: 400 }
            );
          }
        }
      } catch (pdfError: any) {
        console.error('PDF parse error:', pdfError);
        return NextResponse.json({
          error: 'PDFの解析に失敗しました: ' + (pdfError?.message || '不明なエラー')
        }, { status: 400 });
      }
    } else if (type === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    }
  }

  if (!content.trim()) return NextResponse.json({ error: 'コンテンツを抽出できませんでした' }, { status: 400 });

  const doc = await prisma.knowledgeDocument.create({
    data: { organizationId, name, type, sourceUrl, content, status: 'processing' },
  });

  (async () => {
    try {
      const embOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const embApiKey = (embOrg as any)?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY || '';
      if (!embApiKey) {
        await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: 'error' } });
        return;
      }
      const genAI = new GoogleGenerativeAI(embApiKey);
      const chunks = chunkText(content);
      const embeddings = await embedChunks(chunks, genAI);
      await prisma.$transaction(
        chunks.map((chunk, i) =>
          prisma.documentChunk.create({
            data: { documentId: doc.id, content: chunk, chunkIndex: i },
          })
        )
      );
      for (let i = 0; i < chunks.length; i++) {
        const chunk = await prisma.documentChunk.findFirst({
          where: { documentId: doc.id, chunkIndex: i },
        });
        if (chunk) {
          await prisma.$executeRawUnsafe(
            `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
            JSON.stringify(embeddings[i]),
            chunk.id
          );
        }
      }
      await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: 'ready' } });
    } catch {
      await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: 'error' } });
    }
  })();

  return NextResponse.json(doc, { status: 201 });
}
