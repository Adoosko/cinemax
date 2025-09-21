import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const { movieId, progress, completed, watchHistoryId } = await req.json();

    if (!movieId || progress === undefined) {
      return NextResponse.json(
        { error: 'Movie ID and progress are required' },
        { status: 400 }
      );
    }

    // Check if the user has an active subscription
    const subscription = await db.subscription.findUnique({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    // If the user is trying to complete a movie and they're not premium,
    // check if they've reached their monthly limit
    if (completed && !subscription) {
      // Get the current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Count completed movies for the current month
      const watchedCount = await db.watchHistory.count({
        where: {
          userId,
          completed: true,
          completedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Free users can only complete 2 movies per month
      if (watchedCount >= 2) {
        return NextResponse.json(
          { error: 'Monthly watch limit reached' },
          { status: 403 }
        );
      }
    }

    // Prepare data for upsert
    const data: any = {
      userId,
      movieId,
      progress,
      completed: completed || false,
      updatedAt: new Date(),
    };

    // If the movie is completed, set the completedAt timestamp
    if (completed) {
      data.completedAt = new Date();
    }

    // If user has a subscription, associate it with the watch history
    if (subscription) {
      data.subscriptionId = subscription.id;
    }

    // Update or create the watch history entry
    const watchHistory = await db.watchHistory.upsert({
      where: {
        id: watchHistoryId || 'create-new', // If no ID provided, this will force create
        userId_movieId: {
          userId,
          movieId,
        },
      },
      update: data,
      create: {
        ...data,
        startedAt: new Date(),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ watchHistory });
  } catch (error) {
    console.error('Error updating watch history:', error);
    return NextResponse.json(
      { error: 'Failed to update watch history' },
      { status: 500 }
    );
  }
}
