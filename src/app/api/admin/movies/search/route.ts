import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// TMDB API key would normally be in environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Search for movies using TMDB API
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    // Format the response to match our needs
    const movies = data.results.map((movie: any) => ({
      tmdbId: movie.id,
      title: movie.title,
      description: movie.overview,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      releaseDate: movie.release_date,
      rating: movie.vote_average ? movie.vote_average.toString() : null,
    }));

    return NextResponse.json({ movies });
  } catch (error) {
    console.error('Movie search error:', error);
    return NextResponse.json({ error: 'Failed to search for movies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tmdbId } = await request.json();

    if (!tmdbId) {
      return NextResponse.json({ error: 'TMDB ID is required' }, { status: 400 });
    }

    // Get detailed movie info
    const movieResponse = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!movieResponse.ok) {
      throw new Error(`TMDB API error: ${movieResponse.status}`);
    }

    const movieData = await movieResponse.json();

    // Format the response to match our schema
    const movie = {
      title: movieData.title,
      description: movieData.overview,
      duration: movieData.runtime || 120, // Default to 120 minutes if not available
      genre: movieData.genres.map((g: any) => g.name),
      rating: movieData.vote_average ? movieData.vote_average.toString() : '0',
      director: movieData.credits?.crew?.find((p: any) => p.job === 'Director')?.name || '',
      cast: movieData.credits?.cast?.slice(0, 10).map((actor: any) => actor.name) || [],
      posterUrl: movieData.poster_path
        ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
        : null,
      trailerUrl: '',
      releaseDate: movieData.release_date || '',
    };

    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Movie details error:', error);
    return NextResponse.json({ error: 'Failed to get movie details' }, { status: 500 });
  }
}
