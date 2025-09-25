import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

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
    const { seriesId, seasonNumber, episodeNumber, videoUrl } = data;

    if (!seriesId || !seasonNumber || !episodeNumber || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: seriesId, seasonNumber, episodeNumber, videoUrl' },
        { status: 400 }
      );
    }

    // Find the season by series ID and season number
    const season = await prisma.season.findFirst({
      where: {
        seriesId,
        number: parseInt(seasonNumber),
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: `Season ${seasonNumber} not found for this series` },
        { status: 404 }
      );
    }

    // Find the episode by season ID and episode number
    const episode = await prisma.episode.findFirst({
      where: {
        seasonId: season.id,
        number: parseInt(episodeNumber),
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: `Episode ${episodeNumber} not found in season ${seasonNumber}` },
        { status: 404 }
      );
    }

    // Update the episode with the video URL
    const updatedEpisode = await prisma.episode.update({
      where: {
        id: episode.id,
      },
      data: {
        videoUrl,
      },
    });

    return NextResponse.json({ success: true, episode: updatedEpisode });
  } catch (error) {
    console.error('Error uploading episode video:', error);
    return NextResponse.json({ error: 'Failed to upload episode video' }, { status: 500 });
  }
}
