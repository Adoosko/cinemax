import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { episodeId, progress, positionSeconds, completed, watchHistoryId } = body;

    if (!episodeId) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 1) {
      return NextResponse.json(
        { error: 'Progress must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    let watchHistory;

    if (watchHistoryId) {
      // Update existing watch history
      watchHistory = await prisma.episodeWatchHistory.update({
        where: {
          id: watchHistoryId,
          userId: session.user.id, // Ensure user owns this history
        },
        data: {
          progress,
          ...(positionSeconds !== undefined ? { positionSeconds } : {}),
          completed: completed || false,
          completedAt: completed ? new Date() : null,
        },
      });
    } else {
      // Create new watch history
      watchHistory = await prisma.episodeWatchHistory.create({
        data: {
          userId: session.user.id,
          episodeId,
          progress,
          positionSeconds: positionSeconds || 0,
          completed: completed || false,
          completedAt: completed ? new Date() : null,
        },
      });
    }

    // If episode is completed, also update series progress
    if (completed) {
      await updateSeriesProgress(session.user.id, episodeId);
    }

    return NextResponse.json({
      success: true,
      watchHistory,
    });
  } catch (error) {
    console.error('Failed to update episode watch history:', error);
    return NextResponse.json({ error: 'Failed to update watch history' }, { status: 500 });
  }
}

// Helper function to update series progress when an episode is completed
async function updateSeriesProgress(userId: string, episodeId: string) {
  try {
    // Get the episode with season and series info
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        season: {
          include: {
            series: {
              include: {
                seasons: {
                  include: {
                    episodes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!episode) return;

    const series = episode.season.series;

    // Count total episodes in the series
    const totalEpisodes = series.seasons.reduce(
      (total, season) => total + season.episodes.length,
      0
    );

    // Count completed episodes by this user
    const completedEpisodes = await prisma.episodeWatchHistory.count({
      where: {
        userId,
        episode: {
          season: {
            seriesId: series.id,
          },
        },
        completed: true,
      },
    });

    const seriesProgress = completedEpisodes / totalEpisodes;

    // Update or create series watch history
    await prisma.seriesWatchHistory.upsert({
      where: {
        userId_seriesId: {
          userId,
          seriesId: series.id,
        },
      },
      update: {
        progress: seriesProgress,
        completed: seriesProgress >= 0.99, // Consider completed if 99% done
        completedAt: seriesProgress >= 0.99 ? new Date() : null,
      },
      create: {
        userId,
        seriesId: series.id,
        progress: seriesProgress,
        completed: seriesProgress >= 0.99,
        completedAt: seriesProgress >= 0.99 ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Failed to update series progress:', error);
  }
}
