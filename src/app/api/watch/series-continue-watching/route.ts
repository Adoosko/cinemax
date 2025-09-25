import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all episode watch history for the user
    const continueWatching = await prisma.episodeWatchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        episode: {
          include: {
            season: {
              include: {
                series: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Group by series and take the most recent episode per series
    const seriesMap = new Map<string, (typeof continueWatching)[0]>();

    for (const history of continueWatching) {
      const seriesId = history.episode.season.series.id;
      if (!seriesMap.has(seriesId)) {
        seriesMap.set(seriesId, history);
      }
    }

    // Sort series: incomplete first, then by recency
    const result = Array.from(seriesMap.values())
      .sort((a, b) => {
        const aIncomplete = a.progress < 0.99;
        const bIncomplete = b.progress < 0.99;

        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })
      .map((history) => ({
        id: history.id,
        seriesId: history.episode.season.series.id,
        seriesTitle: history.episode.season.series.title,
        seriesSlug: history.episode.season.series.slug,
        seriesCover: history.episode.season.series.coverUrl || '',
        seasonNumber: history.episode.season.number,
        episodeNumber: history.episode.number,
        episodeTitle: history.episode.title,
        episodeCover: history.episode.coverUrl || '',
        positionSeconds: (history as any).positionSeconds || 0,
        progress: history.progress,
        lastActive: history.updatedAt.toISOString(),
      }));

    return NextResponse.json({
      continueWatching: result,
    });
  } catch (error) {
    console.error('Failed to fetch series continue watching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch continue watching series' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');

    if (!seriesId) {
      return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
    }

    // Delete all episode watch history for this series and user
    await prisma.episodeWatchHistory.deleteMany({
      where: {
        userId: session.user.id,
        episode: {
          season: {
            seriesId: seriesId,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove series from continue watching:', error);
    return NextResponse.json({ error: 'Failed to remove from continue watching' }, { status: 500 });
  }
}
