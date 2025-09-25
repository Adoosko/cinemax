'use cache';

import { type Movie } from '@/lib/data/movies-with-use-cache';

// This component fetches and caches a single movie by slug
export async function fetchCachedMovieBySlug(slug: string): Promise<Movie | null> {
  // During build time, return null to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log(`Build time: Skipping movie fetch for slug ${slug}`);
    return null;
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    const url = `${baseUrl}/api/movies/${slug}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie by slug: ${response.status}`);
    }

    const data = await response.json();

    // Debug logging
    console.log(`Fetched movie data for slug ${slug}:`, {
      dataType: typeof data,
      isNull: data === null,
      hasMovieProperty: data && typeof data === 'object' && 'movie' in data,
      keys: data && typeof data === 'object' ? Object.keys(data) : [],
      firstFewProps:
        data && typeof data === 'object'
          ? Object.entries(data)
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${typeof v}`)
          : [],
    });

    // The API returns the movie directly, not wrapped in a 'movie' property
    if (data && typeof data === 'object' && ('id' in data || 'title' in data)) {
      return data;
    } else if (data && typeof data === 'object' && 'movie' in data) {
      return data.movie;
    } else {
      console.error('Unexpected API response format for movie:', data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching movie by slug ${slug}:`, error);
    return null;
  }
}

// This component fetches and caches a single movie by ID
export async function fetchCachedMovieById(id: string): Promise<Movie | null> {
  // During build time, return null to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log(`Build time: Skipping movie fetch for id ${id}`);
    return null;
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    const url = `${baseUrl}/api/movies/${id}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie: ${response.status}`);
    }

    const data = await response.json();
    return data.movie || null;
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
}

// This component fetches and caches all movies for the public page
export async function fetchCachedPublicMovies(): Promise<Movie[]> {
  // During build time, return empty array to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    const url = `${baseUrl}/api/movies`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    // The API returns an array directly, not an object with a movies property
    const data = await response.json();

    // Check if the response is an array
    if (Array.isArray(data)) {
      return data;
    } else if (data.movies && Array.isArray(data.movies)) {
      return data.movies;
    } else {
      console.error('Unexpected API response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching public movies:', error);
    return [];
  }
}

// This component fetches and caches movie video data
export async function fetchCachedMovieVideo(
  slug: string,
  useDirect: boolean = true
): Promise<Movie | null> {
  // During build time, return null to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log(`Build time: Skipping movie video fetch for slug ${slug}`);
    return null;
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    const url = useDirect
      ? `${baseUrl}/api/movies/${slug}/video?direct=true`
      : `${baseUrl}/api/movies/${slug}/video`;

    console.log(`Fetching cached movie video from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie video: ${response.status}`);
    }

    const data = await response.json();
    return data.movie || null;
  } catch (error) {
    console.error(`Error fetching movie video for ${slug}:`, error);
    return null;
  }
}

// This component renders movie data with cached data
export async function CachedMovieData({ slug }: { slug: string }) {
  // During build time, return null to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log(`Build time: Skipping CachedMovieData for slug ${slug}`);
    return {
      movie: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  const movie = await fetchCachedMovieBySlug(slug);

  // Debug logging
  console.log('CachedMovieData result:', {
    hasMovie: Boolean(movie),
    movieType: movie ? typeof movie : 'null',
    movieId: movie?.id,
    movieTitle: movie?.title,
    movieSlug: movie?.slug,
  });

  return {
    movie,
    fetchedAt: new Date().toISOString(),
  };
}

// This component renders movie video data with cached data
export async function CachedMovieVideoData({
  slug,
  useDirect = true,
}: {
  slug: string;
  useDirect?: boolean;
}) {
  const videoData = await fetchCachedMovieVideo(slug, useDirect);

  return {
    videoData,
    fetchedAt: new Date().toISOString(),
  };
}

// This component renders all public movies with cached data
export async function CachedPublicMoviesData() {
  const movies = await fetchCachedPublicMovies();

  return {
    movies,
    count: movies.length,
    featuredMovies: movies.filter((m) => m.isActive).slice(0, 5),
    newReleases: movies
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, 10),
    fetchedAt: new Date().toISOString(),
  };
}
