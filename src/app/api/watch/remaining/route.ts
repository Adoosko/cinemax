import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { FREE_USER_MONTHLY_LIMIT } from '../../../../../config/contants';

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

    // Check if the user has an active subscription
    const subscription = await db.subscription.findUnique({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    // If the user has an active subscription, they have unlimited watches
    if (subscription) {
      return NextResponse.json({
        isPremium: true,
        watchedCount: 0,
        remaining: Infinity,
        limit: Infinity,
      });
    }

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

    // Calculate remaining watches
    const remaining = Math.max(0, FREE_USER_MONTHLY_LIMIT - watchedCount);

    return NextResponse.json({
      isPremium: false,
      watchedCount,
      remaining,
      limit: FREE_USER_MONTHLY_LIMIT,
    });
  } catch (error) {
    console.error('Error checking remaining watches:', error);
    return NextResponse.json({ error: 'Failed to check remaining watches' }, { status: 500 });
  }
}
