import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// DELETE - Delete a specific episode
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string; episodeId: string }> }
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

    const { id: seriesId, seasonId, episodeId } = await params;

    // Verify the episode belongs to the season and series
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          id: seasonId,
          seriesId: seriesId,
        },
      },
      include: {
        season: {
          include: {
            series: true,
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Delete the episode (this will cascade delete its watch history)
    await prisma.episode.delete({
      where: { id: episodeId },
    });

    // Revalidate the series pages to reflect changes
    revalidatePath('/series');
    revalidatePath(`/series/${episode.season.series.slug}`);
    revalidatePath(`/series/${episode.season.series.slug}/season/${episode.season.number}`);
    revalidatePath(
      `/series/${episode.season.series.slug}/season/${episode.season.number}/episode/${episode.number}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
