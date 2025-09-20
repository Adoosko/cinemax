'use cache';

export type Movie = {
  id: string;
  title: string;
  description: string;
  duration: number | string;
  genre: string[] | string;
  rating?: string | number;
  director: string;
  cast: string[];
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  showtimes?: string[];
  // Additional fields for compatibility with different movie sources
  durationMinutes?: number;
  genreArray?: string[];
  releaseDateFull?: Date;
  streamingUrl?: string;
  featured?: boolean;
  // Review related fields
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user?: {
      name: string;
    };
  }>;
  averageReview?: number | null;
};

export async function getMovies(isAdmin: boolean = false): Promise<Movie[]> {
  try {
    const endpoint = isAdmin ? '/api/admin/movies' : '/api/movies';
    const url = new URL(endpoint, 'http://localhost:3000');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    const data = await response.json();
    return data.movies || [];
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

// Get a single movie by ID
export async function getMovieById(id: string): Promise<Movie | null> {
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

// Get a single movie by slug
export async function getMovieBySlug(slug: string): Promise<Movie | null> {
  try {
    const url = new URL(`/api/movies/slug/${slug}`, 'http://localhost:3000');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie by slug: ${response.status}`);
    }

    const data = await response.json();
    return data.movie || null;
  } catch (error) {
    console.error(`Error fetching movie by slug ${slug}:`, error);
    return null;
  }
}

// Add a movie and revalidate the cache
export async function addMovie(movieData: Partial<Movie>): Promise<Movie | null> {
  try {
    const url = new URL('/api/admin/movies', 'http://localhost:3000');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add movie: ${response.status}`);
    }

    const { movie } = await response.json();

    // Revalidate the cache by calling the revalidation API
    await revalidateMoviesCache();

    return movie;
  } catch (error) {
    console.error('Error adding movie:', error);
    return null;
  }
}

// Update a movie and revalidate the cache
export async function updateMovie(id: string, movieData: Partial<Movie>): Promise<Movie | null> {
  try {
    const url = new URL(`/api/admin/movies/${id}`, 'http://localhost:3000');
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update movie: ${response.status}`);
    }

    const { movie } = await response.json();

    // Revalidate the cache by calling the revalidation API
    await revalidateMoviesCache(['movies', `movie-${id}`]);

    return movie;
  } catch (error) {
    console.error(`Error updating movie ${id}:`, error);
    return null;
  }
}

// Delete a movie and revalidate the cache
export async function deleteMovie(id: string): Promise<boolean> {
  try {
    const url = new URL(`/api/admin/movies/${id}`, 'http://localhost:3000');
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete movie: ${response.status}`);
    }

    // Revalidate the cache by calling the revalidation API
    await revalidateMoviesCache(['movies', `movie-${id}`]);

    return true;
  } catch (error) {
    console.error(`Error deleting movie ${id}:`, error);
    return false;
  }
}

// Helper function to revalidate the cache
async function revalidateMoviesCache(tags: string | string[] = 'movies'): Promise<boolean> {
  try {
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    // Call revalidation API for each tag
    await Promise.all(
      tagsArray.map(async (tag) => {
        const revalidateUrl = new URL(`/api/revalidate?tag=${tag}`, 'http://localhost:3000');
        const revalidateResponse = await fetch(revalidateUrl, { method: 'POST' });

        if (!revalidateResponse.ok) {
          throw new Error(`Failed to revalidate tag ${tag}: ${revalidateResponse.status}`);
        }
      })
    );

    return true;
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return false;
  }
}
