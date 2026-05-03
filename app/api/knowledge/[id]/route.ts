import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: doc.organizationId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.knowledgeDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
