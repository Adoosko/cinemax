import { formatGenre } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    // Build where clause with filtering
    const whereClause: any = {
      isActive: true,
      isPublished: true,
    };

    // Add genre filter if specified
    if (genre && genre !== 'all') {
      whereClause.genres = {
        hasSome: [genre],
      };
    }

    // Add search filter if specified
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'releaseYear':
        orderBy = { releaseYear: 'desc' };
        break;
      case 'popularity':
        orderBy = { createdAt: 'desc' }; // Use creation date as proxy for popularity
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const series = await prisma.series.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        title: true,
        genres: true,
        releaseYear: true,
        description: true,
        coverUrl: true,
        backdropUrl: true,
        cast: true,
        director: true,
        rating: true,
        createdAt: true,
        _count: {
          select: {
            seasons: true,
          },
        },
        seasons: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            number: true,
            _count: {
              select: {
                episodes: true,
              },
            },
          },
          orderBy: {
            number: 'asc',
          },
        },
      },
      orderBy,
    });

    // Transform the data to match the expected format - optimized response
    const transformedSeries = series.map((seriesItem, index) => ({
      id: seriesItem.id,
      slug: seriesItem.slug,
      title: seriesItem.title,
      genre: formatGenre(seriesItem.genres),
      releaseYear: seriesItem.releaseYear?.toString() || '2024',
      description: seriesItem.description || 'An exciting TV series awaits you.',
      coverUrl: seriesItem.coverUrl || '/placeholder-series.jpg',
      backdropUrl: seriesItem.backdropUrl,
      seasonsCount: seriesItem.seasons.length,
      totalEpisodes: seriesItem.seasons.reduce(
        (total, season) => total + season._count.episodes,
        0
      ),
      rating: seriesItem.rating || 'TV-14',
      cast: seriesItem.cast || [],
      director: seriesItem.director || 'Various Directors',
      featured: index === 0, // Mark first series as featured
    }));

    return NextResponse.json(
      {
        series: transformedSeries,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}
