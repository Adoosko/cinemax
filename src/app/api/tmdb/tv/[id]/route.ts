import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch TV series details
    const detailsUrl = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,seasons`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsResponse.status !== 200) {
      return NextResponse.json(
        { error: 'Failed to fetch TV series details' },
        { status: detailsResponse.status }
      );
    }

    return NextResponse.json(detailsData);
  } catch (error) {
    console.error('Error fetching TV series details:', error);
    return NextResponse.json({ error: 'Failed to fetch TV series details' }, { status: 500 });
  }
}
