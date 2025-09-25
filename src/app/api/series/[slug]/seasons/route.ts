import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Series slug is required' }, { status: 400 });
    }

    // Fetch all seasons for the series
    const seasons = await prisma.season.findMany({
      where: {
        series: {
          slug: slug,
          isActive: true,
          isPublished: true,
        },
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
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    // Transform the seasons data
    const transformedSeasons = seasons.map((season) => ({
      id: season.id,
      number: season.number,
      title: season.title || `Season ${season.number}`,
      description: season.description,
      releaseDate: season.releaseDate,
      coverUrl: season.coverUrl,
      episodeCount: season.episodes.length,
      episodes: season.episodes,
    }));

    return NextResponse.json(transformedSeasons);
  } catch (error) {
    console.error('Failed to fetch seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}
