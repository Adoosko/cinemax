'use cache';

import { type Movie } from '@/lib/data/movies-with-use-cache';

// This component fetches and caches a single movie by slug
export async function fetchCachedMovieBySlug(slug: string): Promise<Movie | null> {
  try {
    const url = new URL(`/api/movies/${slug}`, 'http://localhost:3000');
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
  try {
    const url = new URL(`/api/movies/${id}`, 'http://localhost:3000');
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
  try {
    const url = new URL('/api/movies', 'http://localhost:3000');
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
): Promise<any | null> {
  try {
    const baseUrl = new URL(`/api/movies/${slug}/video`, 'http://localhost:3000');

    // Add direct=true parameter to use direct URLs instead of presigned URLs
    if (useDirect) {
      baseUrl.searchParams.append('direct', 'true');
    }

    console.log(`Fetching cached movie video from: ${baseUrl.toString()}`);
    const response = await fetch(baseUrl);

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
