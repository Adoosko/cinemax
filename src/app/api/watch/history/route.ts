import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user's unfinished movies
    const watchHistory = await db.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progress: {
          lt: 0.99, // Less than 99% watched
        },
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            slug: true,
            streamingUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 8, // Limit to last 8
    });

    return NextResponse.json({ watchHistory });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json({ error: 'Failed to fetch watch history' }, { status: 500 });
  }
}

// Delete a watch history entry (for removing from "Continue Watching")
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

    // Get the watch history ID from the request
    const { searchParams } = new URL(req.url);
    const watchHistoryId = searchParams.get('id');

    if (!watchHistoryId) {
      return NextResponse.json({ error: 'Watch history ID is required' }, { status: 400 });
    }

    // Delete the watch history entry
    await db.watchHistory.deleteMany({
      where: {
        id: watchHistoryId,
        userId, // Ensure the user owns this watch history
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting watch history:', error);
    return NextResponse.json({ error: 'Failed to delete watch history' }, { status: 500 });
  }
}
