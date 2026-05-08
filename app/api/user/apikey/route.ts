import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { geminiApiKey: true } });

  const hasKey = !!user?.geminiApiKey;
  const key = user?.geminiApiKey || '';
  const maskedKey = hasKey ? 'AIza...' + key.slice(-4) : null;

  return NextResponse.json({ hasKey, maskedKey });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { apiKey } = await req.json();

  await prisma.user.update({
    where: { id: userId },
    data: { geminiApiKey: apiKey ? apiKey.trim() : null },
  });

  return NextResponse.json({ success: true });
}
