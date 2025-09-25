import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Movie slug is required' }, { status: 400 });
    }

    // First, find the movie by its slug
    const movie = await db.movie.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Find active watch parties for this movie
    const activeParties = await db.watchParty.findMany({
      where: {
        movieId: movie.id,
        isActive: true,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        // Include host user data
        host: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to 5 most recent active parties
    });

    // Transform the data to include participant count
    // Note: You'll need to implement participant tracking in your database schema
    // For now, we'll use a placeholder count
    const partiesWithCount = activeParties.map((party) => ({
      id: party.id,
      host: party.host, // Use the host relationship
      participantCount: Math.floor(Math.random() * 8) + 1, // Placeholder - replace with actual count
      createdAt: party.createdAt,
      isActive: party.isActive,
    }));

    return NextResponse.json({
      success: true,
      activeParties: partiesWithCount,
    });
  } catch (error) {
    console.error('Error fetching active parties:', error);
    return NextResponse.json({ error: 'Failed to fetch active parties' }, { status: 500 });
  }
}
