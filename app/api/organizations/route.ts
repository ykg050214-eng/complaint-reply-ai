import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: (session!.user as any).id },
    include: { organization: true },
  });

  return NextResponse.json(memberships.map(m => ({ ...m.organization, role: m.role })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: (session!.user as any).id, role: 'owner' },
      },
    },
  });

  return NextResponse.json(org, { status: 201 });
}
