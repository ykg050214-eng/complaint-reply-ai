import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: doc.organizationId,
        userId: (session!.user as any).id,
      },
    },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.knowledgeDocument.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
