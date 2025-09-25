import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's episode watch history
    const watchHistory = await prisma.episodeWatchHistory.findMany({
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

    return NextResponse.json({
      watchHistory: watchHistory.map((history) => ({
        id: history.id,
        episodeId: history.episodeId,
        progress: history.progress,
        completed: history.completed,
        completedAt: history.completedAt,
        startedAt: history.startedAt,
        updatedAt: history.updatedAt,
        episode: {
          id: history.episode.id,
          title: history.episode.title,
          number: history.episode.number,
          season: {
            id: history.episode.season.id,
            number: history.episode.season.number,
            series: {
              id: history.episode.season.series.id,
              title: history.episode.season.series.title,
              slug: history.episode.season.series.slug,
            },
          },
        },
      })),
    });
  } catch (error) {
    console.error('Failed to fetch episode watch history:', error);
    return NextResponse.json({ error: 'Failed to fetch watch history' }, { status: 500 });
  }
}
