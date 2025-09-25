import { VideoService } from '@/lib/services/video-service';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; seasonNumber: string; episodeNumber: string }> }
) {
  try {
    const { slug, seasonNumber, episodeNumber } = await params;
    const { searchParams } = new URL(request.url);
    const quality = searchParams.get('quality') || '720p';

    if (!slug || !seasonNumber || !episodeNumber) {
      return NextResponse.json(
        { error: 'Series slug, season number, and episode number are required' },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(seasonNumber);
    const episodeNum = parseInt(episodeNumber);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
      return NextResponse.json({ error: 'Invalid season or episode number' }, { status: 400 });
    }

    // Fetch episode to get the actual title for proper path construction
    const episode = await prisma.episode.findFirst({
      where: {
        number: episodeNum,
        season: {
          number: seasonNum,
          series: {
            slug: slug,
            isActive: true,
            isPublished: true,
          },
        },
        isActive: true,
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

    // Use simple path structure: series-slug/season-X/episodes/Y
    const videoPath = `${slug}/season-${seasonNum}/episodes/${episodeNum}`;

    // Generate presigned URL for viewing the episode
    const presignedUrl = await VideoService.getEpisodePresignedUrl(videoPath, quality, 7200);

    return NextResponse.json({
      success: true,
      url: presignedUrl,
      quality,
      expiresIn: 7200, // 2 hours
      videoPath, // Include for debugging
    });
  } catch (error) {
    console.error('Error generating episode presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
  }
}
