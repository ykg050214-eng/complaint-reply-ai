import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

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

async function embedChunks(chunks: string[], openai: OpenAI): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  });
  return response.data.map(d => d.embedding);
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
        if (!content.trim()) {
          return NextResponse.json({
            error: 'PDFからテキストを抽出できませんでした。スキャン画像PDFやパスワード保護されたPDFは対応していません。テキスト形式のPDFをご使用ください。'
          }, { status: 400 });
        }
      } catch (pdfError: any) {
        console.error('PDF parse error:', pdfError);
        return NextResponse.json({
          error: `PDFの解析に失敗しました: ${pdfError?.message || '不明なエラー'}。パスワード保護されたPDFやスキャン画像PDFは対応していません。`
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

  // Embed chunks in background
  (async () => {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const chunks = chunkText(content);
      const embeddings = await embedChunks(chunks, openai);
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
