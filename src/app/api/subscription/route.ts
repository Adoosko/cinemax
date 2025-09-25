import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate session server-side
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ subscription: null, error: 'Unauthorized' }, { status: 401 });
    }

    // For ISR, we'll return cached data or fetch fresh
    // In a real implementation, you'd call your subscription service here
    // For now, return mock data for premium users

    // Mock premium subscription for demonstration
    const mockSubscription = {
      id: 'premium-subscription',
      status: 'ACTIVE',
      recurringInterval: 'monthly',
      productId: 'premium-plan',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      currentPeriodStart: new Date().toISOString(),
      product: {
        id: 'premium-plan',
        name: 'Premium Plan',
      },
    };

    return NextResponse.json({
      subscription: mockSubscription,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json(
      { subscription: null, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// ISR: Revalidate every 5 minutes
export const revalidate = 300; // 5 minutes
