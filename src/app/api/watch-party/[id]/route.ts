import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Watch party ID is required' }, { status: 400 });
    }

    const watchParty = await db.watchParty.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            backdropUrl: true,
            description: true,
            duration: true,
            genre: true,
            rating: true,
            director: true,
            cast: true,
            streamingUrl: true,
          },
        },
      },
    });

    if (!watchParty) {
      return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
    }

    // Check if the party is expired or inactive
    const now = new Date();
    const isExpired = watchParty.expiresAt && watchParty.expiresAt <= now;
    const isInactive = !watchParty.isActive;

    if (isExpired || isInactive) {
      return NextResponse.json(
        {
          error: 'Watch party has expired or ended',
          party: {
            id: watchParty.id,
            isActive: false,
            isExpired,
            expiredAt: watchParty.expiresAt,
          },
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      watchParty: {
        id: watchParty.id,
        host: watchParty.host,
        movie: watchParty.movie,
        createdAt: watchParty.createdAt,
        expiresAt: watchParty.expiresAt,
        maxGuests: watchParty.maxGuests,
        isActive: watchParty.isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching watch party:', error);
    return NextResponse.json({ error: 'Failed to fetch watch party' }, { status: 500 });
  }
}

// DELETE endpoint to end a watch party (host only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // TODO: Add authentication check to ensure only host can delete

    await db.watchParty.update({
      where: { id },
      data: {
        isActive: false,
        expiresAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending watch party:', error);
    return NextResponse.json({ error: 'Failed to end watch party' }, { status: 500 });
  }
}
