import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET a specific series by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        seasons: {
          include: {
            episodes: true,
          },
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

// PATCH - Update a series
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const data = await request.json();

    const series = await prisma.series.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        genres: data.genres || [],
        releaseYear: data.releaseYear,
        coverUrl: data.coverUrl,
        backdropUrl: data.backdropUrl,
        cast: data.cast || [],
        rating: data.rating,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isPublished: data.isPublished !== undefined ? data.isPublished : false,
      },
    });

    // Revalidate the series list and specific series page
    revalidatePath('/series');
    revalidatePath(`/series/${series.slug}`);
    // Revalidate all season/episode pages for this series
    const seasons = await prisma.season.findMany({
      where: { seriesId: id },
      include: { episodes: true },
    });
    for (const season of seasons) {
      revalidatePath(`/series/${series.slug}/season/${season.number}`);
      for (const episode of season.episodes) {
        revalidatePath(`/series/${series.slug}/season/${season.number}/episode/${episode.number}`);
      }
    }

    return NextResponse.json({ success: true, series });
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

// DELETE - Delete a series
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const data = await request.json();

    const slug = data.slug;

    // Delete the series

    await prisma.series.delete({
      where: { id },
    });

    // Revalidate the series list page
    revalidatePath('/series');
    revalidatePath('/admin/series');
    revalidatePath(`/series/${slug}`);
    // Note: All season/episode pages will be automatically invalidated when series is deleted

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
