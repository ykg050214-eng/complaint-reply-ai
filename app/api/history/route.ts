import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    const records = await prisma.complaintResponse.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, complaintText: true, industry: true, channel: true, tone: true, stance: true, createdAt: true },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: '履歴の取得に失敗しました。' }, { status: 500 });
  }
}