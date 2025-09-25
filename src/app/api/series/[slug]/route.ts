import { formatDuration, formatGenre } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Series slug is required' }, { status: 400 });
    }

    // Fetch series by slug with related data
    const series = await prisma.series.findUnique({
      where: {
        slug: slug,
        isActive: true,
        isPublished: true,
      },
      include: {
        seasons: {
          where: {
            isActive: true,
          },
          include: {
            episodes: {
              where: {
                isActive: true,
              },
              orderBy: {
                number: 'asc',
              },
            },
          },
          orderBy: {
            number: 'asc',
          },
        },
        reviews: {
          where: {
            isApproved: true,
          },
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            seasons: true,
          },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Transform the series data
    const transformedSeries = {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description || 'An exciting TV series awaits you.',
      genre: formatGenre(series.genres),
      genres: series.genres,
      releaseYear: series.releaseYear?.toString() || '2024',
      releaseDateFull: series.releaseYear,
      director: series.director || 'Various Directors',
      cast: series.cast || [],
      coverUrl:
        series.coverUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      backdropUrl:
        series.backdropUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
      rating: series.rating || 'TV-14',

      // Seasons with episodes
      seasons: series.seasons.map((season) => ({
        id: season.id,
        number: season.number,
        title: season.title || `Season ${season.number}`,
        description: season.description,
        releaseDate: season.releaseDate,
        coverUrl: season.coverUrl,
        episodeCount: season.episodes.length,
        episodes: season.episodes.map((episode) => ({
          id: episode.id,
          number: episode.number,
          title: episode.title,
          description: episode.description,
          runtime: episode.runtime,
          runtimeFormatted: formatDuration(episode.runtime),
          coverUrl: episode.coverUrl || season.coverUrl,
          airDate: episode.airDate,
          videoUrl: episode.videoUrl,
        })),
      })),

      // Reviews with user info
      reviews: series.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name:
            review.user.name ||
            `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() ||
            'Anonymous User',
        },
      })),

      // Average rating from reviews
      averageReview:
        series.reviews.length > 0
          ? series.reviews.reduce((sum, review) => sum + review.rating, 0) / series.reviews.length
          : null,

      // Metadata
      totalSeasons: series.seasons.length,
      totalEpisodes: series.seasons.reduce((total, season) => total + season.episodes.length, 0),
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    };

    return NextResponse.json(transformedSeries);
  } catch (error) {
    console.error('Failed to fetch series by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}
