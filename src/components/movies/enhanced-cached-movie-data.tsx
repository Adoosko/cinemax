'use cache';

import { type Movie } from '@/lib/data/movies-with-use-cache';

// Static movie metadata that changes rarely - cache for 1 hour
export async function fetchStaticMovieData(
  slug: string,
  tags: string[] = []
): Promise<{
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  streamingUrl?: string;
  genre: string | string[];
  director: string;
  cast: string[];
  rating: string | number;
  duration: string;
  releaseDate: string;
  isActive: boolean;
  slug: string;
} | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies/${slug}`, {
      next: {
        revalidate: 3600, // 1 hour cache for static data
        tags: ['movie-static', `movie-${slug}`, ...tags],
      },
    });

    if (!response.ok) {
      return null;
    }

    const movie = await response.json();

    // Return only static fields
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      trailerUrl: movie.trailerUrl,
      streamingUrl: movie.streamingUrl,
      genre: movie.genre,
      director: movie.director,
      cast: movie.cast || [],
      rating: movie.rating,
      duration: movie.duration,
      releaseDate: movie.releaseDate,
      isActive: movie.isActive,
      slug: movie.slug,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching static movie data for ${slug}:`, error);
    }
    return null;
  }
}

// Dynamic movie data that changes more frequently - cache for 5 minutes
export async function fetchDynamicMovieData(
  slug: string,
  tags: string[] = []
): Promise<{
  views: number;
  likes: number;
  comments: number;
  watchTime: number;
  lastWatched?: string;
  userRating?: number;
  isBookmarked: boolean;
  continueWatching?: {
    progress: number;
    timestamp: string;
  };
} | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies/${slug}/dynamic`, {
      next: {
        revalidate: 300, // 5 minutes cache for dynamic data
        tags: ['movie-dynamic', `movie-dynamic-${slug}`, ...tags],
      },
    });

    if (!response.ok) {
      // Return empty dynamic data if endpoint doesn't exist
      return {
        views: 0,
        likes: 0,
        comments: 0,
        watchTime: 0,
        isBookmarked: false,
      };
    }

    return await response.json();
  } catch (error) {
    // Return empty dynamic data on error
    return {
      views: 0,
      likes: 0,
      comments: 0,
      watchTime: 0,
      isBookmarked: false,
    };
  }
}

// Frequently changing user-specific data - cache for 1 minute
export async function fetchUserMovieData(
  slug: string,
  userId?: string,
  tags: string[] = []
): Promise<{
  watchProgress?: number;
  lastWatchedAt?: string;
  userRating?: number;
  isBookmarked: boolean;
  isInWatchlist: boolean;
} | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !userId) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies/${slug}/user/${userId}`, {
      next: {
        revalidate: 60, // 1 minute cache for user data
        tags: ['movie-user', `movie-user-${slug}-${userId}`, ...tags],
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

// Related movies that change rarely - cache for 2 hours
export async function fetchRelatedMovies(
  slug: string,
  limit: number = 12,
  tags: string[] = []
): Promise<Movie[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies/${slug}/related?limit=${limit}`, {
      next: {
        revalidate: 7200, // 2 hours cache for related movies
        tags: ['movie-related', `movie-related-${slug}`, ...tags],
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.movies || [];
  } catch (error) {
    return [];
  }
}

// Define comment interface
interface MovieComment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  likes: number;
  replies?: MovieComment[];
}

// Movie comments - cache for 2 minutes
export async function fetchMovieComments(
  slug: string,
  page: number = 1,
  tags: string[] = []
): Promise<{
  comments: MovieComment[];
  totalCount: number;
  hasMore: boolean;
}> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { comments: [], totalCount: 0, hasMore: false };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies/${slug}/comments?page=${page}`, {
      next: {
        revalidate: 120, // 2 minutes cache for comments
        tags: ['movie-comments', `movie-comments-${slug}`, ...tags],
      },
    });

    if (!response.ok) {
      return { comments: [], totalCount: 0, hasMore: false };
    }

    return await response.json();
  } catch (error) {
    return { comments: [], totalCount: 0, hasMore: false };
  }
}

// Featured movies for homepage - cache for 30 minutes
export async function fetchFeaturedMoviesStatic(
  limit: number = 10,
  tags: string[] = []
): Promise<Movie[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies?featured=true&limit=${limit}`, {
      next: {
        revalidate: 1800, // 30 minutes cache for featured movies
        tags: ['movies-featured', ...tags],
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.movies || [];
  } catch (error) {
    return [];
  }
}

// All movies for listing - cache for 15 minutes
export async function fetchAllMoviesStatic(tags: string[] = []): Promise<Movie[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cinemx.adrianfinik.sk';
    const response = await fetch(`${baseUrl}/api/movies`, {
      next: {
        revalidate: 900, // 15 minutes cache for all movies
        tags: ['movies-all', ...tags],
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.movies || [];
  } catch (error) {
    return [];
  }
}

// Cache invalidation helper
export async function getMovieCacheTags(slug: string): Promise<string[]> {
  return [
    `movie-${slug}`,
    `movie-static-${slug}`,
    `movie-dynamic-${slug}`,
    `movie-related-${slug}`,
    `movie-comments-${slug}`,
    'movies-all',
    'movies-featured',
  ];
}

// Enhanced cached movie component that splits data loading
export async function EnhancedCachedMovieData({
  slug,
  userId,
  includeRelated = true,
  includeComments = false,
}: {
  slug: string;
  userId?: string;
  includeRelated?: boolean;
  includeComments?: boolean;
}) {
  const tags = await getMovieCacheTags(slug);

  // Fetch static data (can be pre-rendered)
  const staticData = await fetchStaticMovieData(slug, tags);

  if (!staticData) {
    return {
      movie: null,
      relatedMovies: [],
      comments: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  // Fetch related movies if requested (static data)
  const relatedMovies = includeRelated ? await fetchRelatedMovies(slug, 12, tags) : [];

  // Fetch comments if requested (dynamic data)
  const comments = includeComments ? await fetchMovieComments(slug, 1, tags) : null;

  return {
    movie: staticData,
    relatedMovies,
    comments,
    fetchedAt: new Date().toISOString(),
  };
}
