import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { TMDBService } from '@/lib/services/tmdb-service';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Search TMDB for movies
    const results = await TMDBService.searchMovies(query);

    return NextResponse.json({
      movies: results.results || [],
    });
  } catch (error) {
    console.error('TMDB search error:', error);
    return NextResponse.json({ error: 'Failed to search TMDB' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { tmdbId } = await request.json();

    if (!tmdbId) {
      return NextResponse.json({ error: 'TMDB ID required' }, { status: 400 });
    }

    // Get detailed movie information from TMDB
    const movieDetails = await TMDBService.getMovieDetails(tmdbId);
    const transformedData = TMDBService.transformToMovieData(movieDetails);

    return NextResponse.json({ movieData: transformedData });
  } catch (error) {
    console.error('TMDB movie details error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
