import { formatGenre } from '@/lib/utils/movie-utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const series = await prisma.series.findMany({
      where: {
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
        _count: {
          select: {
            seasons: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedSeries = series.map((seriesItem, index) => ({
      id: seriesItem.id,
      slug: seriesItem.slug,
      title: seriesItem.title,
      genre: formatGenre(seriesItem.genres),
      releaseYear: seriesItem.releaseYear?.toString() || '2024',
      description: seriesItem.description || 'An exciting TV series awaits you.',
      coverUrl:
        seriesItem.coverUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
      backdropUrl:
        seriesItem.backdropUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop',
      seasonsCount: seriesItem.seasons.length,
      totalEpisodes: seriesItem.seasons.reduce(
        (total, season) => total + season.episodes.length,
        0
      ),
      rating: seriesItem.rating || 'TV-14',
      cast: seriesItem.cast || [],
      director: seriesItem.director || 'Various Directors',
      featured: index === 0, // Mark first series as featured
    }));

    return NextResponse.json(transformedSeries);
  } catch (error) {
    console.error('Failed to fetch series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}
