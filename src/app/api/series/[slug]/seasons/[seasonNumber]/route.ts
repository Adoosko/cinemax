import { formatDuration, formatGenre } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; seasonNumber: string }> }
) {
  try {
    const { slug, seasonNumber } = await params;

    if (!slug || !seasonNumber) {
      return NextResponse.json(
        { error: 'Series slug and season number are required' },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(seasonNumber);

    if (isNaN(seasonNum)) {
      return NextResponse.json({ error: 'Invalid season number' }, { status: 400 });
    }

    // Fetch season with series context and episodes
    const season = await prisma.season.findFirst({
      where: {
        number: seasonNum,
        series: {
          slug: slug,
          isActive: true,
          isPublished: true,
        },
        isActive: true,
      },
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
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // Transform the season data
    const transformedSeason = {
      id: season.id,
      number: season.number,
      title: season.title || `Season ${season.number}`,
      description: season.description,
      releaseDate: season.releaseDate,
      coverUrl:
        season.coverUrl ||
        season.series.coverUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',

      // Series context
      series: {
        id: season.series.id,
        slug: season.series.slug,
        title: season.series.title,
        description: season.series.description,
        genre: formatGenre(season.series.genres),
        genres: season.series.genres,
        releaseYear: season.series.releaseYear?.toString() || '2024',
        coverUrl: season.series.coverUrl,
        backdropUrl: season.series.backdropUrl,
        rating: season.series.rating,
        cast: season.series.cast,
        director: season.series.director,
      },

      // Episodes
      episodes: season.episodes.map((episode) => ({
        id: episode.id,
        number: episode.number,
        title: episode.title,
        description: episode.description,
        runtime: episode.runtime,
        runtimeFormatted: formatDuration(episode.runtime),
        airDate: episode.airDate,
        coverUrl: episode.coverUrl || season.coverUrl,
        videoUrl: episode.videoUrl,
      })),

      // Metadata
      episodeCount: season.episodes.length,
      totalRuntime: season.episodes.reduce((total, episode) => total + episode.runtime, 0),
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
    };

    return NextResponse.json(transformedSeason);
  } catch (error) {
    console.error('Failed to fetch season:', error);
    return NextResponse.json({ error: 'Failed to fetch season' }, { status: 500 });
  }
}
