const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  genres?: Array<{ id: number; name: string }>;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  credits?: {
    cast: Array<{ id: number; name: string; character: string }>;
    crew: Array<{ id: number; name: string; job: string }>;
  };
}

export interface TMDBSearchResult {
  page: number;
  results: Array<{
    id: number;
    title: string;
    overview: string;
    release_date: string;
    genre_ids: number[];
    vote_average: number;
    poster_path: string | null;
    backdrop_path: string | null;
  }>;
  total_pages: number;
  total_results: number;
}

export class TMDBService {
  /**
   * Search for movies on TMDB
   */
  static async searchMovies(query: string): Promise<TMDBSearchResult> {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const results = await response.json();
      return results;
    } catch (error) {
      console.error('TMDB search error:', error);
      throw new Error('Failed to search TMDB');
    }
  }

  /**
   * Get detailed movie information by TMDB ID
   */
  static async getMovieDetails(tmdbId: number): Promise<TMDBMovie> {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const movie = await response.json();
      return movie;
    } catch (error) {
      console.error('TMDB movie details error:', error);
      throw new Error('Failed to fetch movie details from TMDB');
    }
  }

  /**
   * Transform TMDB movie data to our database format
   */
  static transformToMovieData(tmdbMovie: TMDBMovie) {
    return {
      title: tmdbMovie.title,
      description: tmdbMovie.overview || '',
      duration: tmdbMovie.runtime || 120,
      genre: tmdbMovie.genres?.map((g) => g.name) || [],
      rating: tmdbMovie.vote_average ? tmdbMovie.vote_average.toFixed(1) : '8.0',
      director: tmdbMovie.credits?.crew?.find((p) => p.job === 'Director')?.name || '',
      cast: tmdbMovie.credits?.cast?.slice(0, 5).map((actor) => actor.name) || [],
      posterUrl: tmdbMovie.poster_path
        ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
        : '',
      backdropUrl: tmdbMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1920${tmdbMovie.backdrop_path}`
        : '',
      releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : new Date(),
      isActive: true,
    };
  }

  /**
   * Search and get the first movie's details in one call
   */
  static async searchAndGetFirstMovie(query: string) {
    try {
      const searchResults = await this.searchMovies(query);

      if (searchResults.results && searchResults.results.length > 0) {
        const firstMovie = searchResults.results[0];
        const movieDetails = await this.getMovieDetails(firstMovie.id);
        return this.transformToMovieData(movieDetails);
      }

      throw new Error('No movies found');
    } catch (error) {
      console.error('TMDB search and fetch error:', error);
      throw error;
    }
  }
}
