import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET all series (admin view)
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

    const series = await prisma.series.findMany({
      include: {
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

// POST - Create a new series
export async function POST(request: NextRequest) {
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

    const data = await request.json();

    // Create the series
    const series = await prisma.series.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        genres: data.genres || [],
        releaseYear: data.releaseYear ? parseInt(data.releaseYear) : null,
        coverUrl: data.coverUrl,
        backdropUrl: data.backdropUrl,
        cast: data.cast || [],
        rating: data.rating ? String(data.rating) : null,
        isActive: true,
        isPublished: data.isPublished || false,
      },
    });

    // Revalidate the series list page to show new content immediately
    revalidatePath('/series');
    revalidatePath('/admin/series');
    revalidatePath(`/series/${series.slug}`);

    return NextResponse.json({ success: true, series });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
