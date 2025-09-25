import { VideoService } from '@/lib/services/video-service';
import { formatDuration, formatGenre, formatReleaseYear } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; seasonNumber: string; episodeNumber: string }> }
) {
  try {
    const { slug, seasonNumber, episodeNumber } = await params;

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

    // Fetch episode with full series and season context
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
            episodes: {
              where: {
                isActive: true,
              },
              orderBy: {
                number: 'asc',
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Always generate fresh presigned URLs for security
    let streamingUrl = null;
    let availableQualities: Array<{ quality: string; url: string; bitrate: number }> = [];
    if (episode.season.series.slug) {
      try {
        // Discover all available qualities for this episode
        availableQualities = await VideoService.discoverEpisodeQualities(
          episode.season.series.slug,
          seasonNum,
          episodeNum,
          episode.title
        );

        // Use the highest quality available
        if (availableQualities.length > 0) {
          streamingUrl = availableQualities[0].url;
        }
      } catch (error) {
        console.log(
          `No videos found for episode ${episode.season.series.slug} S${seasonNum}E${episodeNum}`
        );
      }
    }

    // Transform the episode data
    const transformedEpisode = {
      id: episode.id,
      number: episode.number,
      title: episode.title,
      description: episode.description || 'An exciting episode awaits you.',
      runtime: episode.runtime,
      runtimeFormatted: formatDuration(episode.runtime),
      airDate: episode.airDate,
      coverUrl:
        episode.coverUrl ||
        episode.season.coverUrl ||
        episode.season.series.coverUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      streamingUrl,
      qualities: availableQualities,

      // Series context
      series: {
        id: episode.season.series.id,
        slug: episode.season.series.slug,
        title: episode.season.series.title,
        description: episode.season.series.description,
        genre: formatGenre(episode.season.series.genres),
        genres: episode.season.series.genres,
        releaseYear: formatReleaseYear(episode.season.series.releaseDate),
        coverUrl: episode.season.series.coverUrl,
        backdropUrl: episode.season.series.backdropUrl,
        rating: episode.season.series.rating,
        cast: episode.season.series.cast,
        director: episode.season.series.director,
      },

      // Season context
      season: {
        id: episode.season.id,
        number: episode.season.number,
        title: episode.season.title || `Season ${episode.season.number}`,
        description: episode.season.description,
        releaseDate: episode.season.releaseDate,
        coverUrl: episode.season.coverUrl,
        episodeCount: episode.season.episodes.length,
      },

      // Navigation helpers
      nextEpisode: null as any,
      previousEpisode: null as any,
    };

    // Find next and previous episodes
    const currentIndex = episode.season.episodes.findIndex((e) => e.id === episode.id);

    if (currentIndex > 0) {
      const prevEpisode = episode.season.episodes[currentIndex - 1];
      transformedEpisode.previousEpisode = {
        id: prevEpisode.id,
        number: prevEpisode.number,
        title: prevEpisode.title,
      };
    }

    if (currentIndex < episode.season.episodes.length - 1) {
      const nextEpisode = episode.season.episodes[currentIndex + 1];
      transformedEpisode.nextEpisode = {
        id: nextEpisode.id,
        number: nextEpisode.number,
        title: nextEpisode.title,
      };
    }

    return NextResponse.json(transformedEpisode);
  } catch (error) {
    console.error('Failed to fetch episode:', error);
    return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 });
  }
}
