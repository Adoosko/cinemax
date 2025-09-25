import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; seasonNumber: string } }
) {
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

    const id = params.id;
    const seasonNumber = params.seasonNumber;

    // Fetch TV season details
    const seasonUrl = `${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`;
    const seasonResponse = await fetch(seasonUrl);
    const seasonData = await seasonResponse.json();

    if (seasonResponse.status !== 200) {
      return NextResponse.json(
        { error: 'Failed to fetch season details' },
        { status: seasonResponse.status }
      );
    }

    return NextResponse.json(seasonData);
  } catch (error) {
    console.error('Error fetching season details:', error);
    return NextResponse.json({ error: 'Failed to fetch season details' }, { status: 500 });
  }
}
