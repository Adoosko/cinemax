import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const theaters = await prisma.theater.findMany({
      where: {
        isActive: true,
      },
      include: {
        cinema: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: [{ cinema: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json({ theaters });
  } catch (error) {
    console.error('Failed to fetch theaters:', error);
    return NextResponse.json({ error: 'Failed to fetch theaters' }, { status: 500 });
  }
}
