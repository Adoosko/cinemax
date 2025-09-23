import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createWatchPartySchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user has an active premium subscription
    const subscription = await db.subscription.findUnique({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'Premium subscription required',
          message: 'You need an active premium subscription to create watch parties',
        },
        { status: 403 }
      );
    }

    const { movieId } = await req.json();

    // Validate input
    const validationResult = createWatchPartySchema.safeParse({ movieId });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify movie exists and is active
    const movie = await db.movie.findUnique({
      where: { id: movieId },
      select: { id: true, isActive: true, title: true },
    });

    if (!movie || !movie.isActive) {
      return NextResponse.json({ error: 'Movie not found or unavailable' }, { status: 404 });
    }

    // Check if user already has an active watch party
    const existingParty = await db.watchParty.findFirst({
      where: {
        hostUserId: userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        movie: {
          select: { slug: true },
        },
      },
    });

    if (existingParty) {
      // Generate invite link for existing party
      const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const inviteLink = `${baseUrl}/movies/${existingParty.movie.slug}/watch?party=${existingParty.id}`;

      return NextResponse.json(
        {
          error: 'Active watch party exists',
          message:
            'You already have an active watch party. Please end it before creating a new one.',
          partyId: existingParty.id,
          inviteLink: inviteLink,
        },
        { status: 409 }
      );
    }

    // Create the watch party with 4-hour expiration
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    const watchParty = await db.watchParty.create({
      data: {
        hostUserId: userId,
        movieId,
        expiresAt,
      },
      include: {
        host: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        movie: {
          select: { id: true, title: true, posterUrl: true, slug: true },
        },
      },
    });

    // Generate invite link using the request origin for full public URL
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const inviteLink = `${baseUrl}/movies/${watchParty.movie.slug}/watch?party=${watchParty.id}`;

    return NextResponse.json({
      success: true,
      watchParty: {
        id: watchParty.id,
        host: watchParty.host,
        movie: watchParty.movie,
        createdAt: watchParty.createdAt,
        expiresAt: watchParty.expiresAt,
        maxGuests: watchParty.maxGuests,
      },
      inviteLink,
    });
  } catch (error) {
    console.error('Error creating watch party:', error);
    return NextResponse.json({ error: 'Failed to create watch party' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get party ID from URL search params
    const url = new URL(req.url);
    const partyId = url.searchParams.get('partyId');

    if (!partyId) {
      return NextResponse.json({ error: 'Party ID is required' }, { status: 400 });
    }

    // Find and verify the watch party belongs to the user
    const watchParty = await db.watchParty.findUnique({
      where: { id: partyId },
      select: { hostUserId: true, isActive: true },
    });

    if (!watchParty) {
      return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
    }

    if (watchParty.hostUserId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own watch parties' },
        { status: 403 }
      );
    }

    if (!watchParty.isActive) {
      return NextResponse.json({ error: 'Watch party is already inactive' }, { status: 400 });
    }

    // Deactivate the watch party
    await db.watchParty.update({
      where: { id: partyId },
      data: { isActive: false },
    });

    // Notify all participants via WebSocket
    const io = (await import('@/lib/websocket-server')).io;
    io.to(partyId).emit('party-ended', {
      reason: 'deleted',
      message: 'This watch party has been ended by the host.',
    });

    return NextResponse.json({
      success: true,
      message: 'Watch party deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting watch party:', error);
    return NextResponse.json({ error: 'Failed to delete watch party' }, { status: 500 });
  }
}
