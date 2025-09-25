import 'server-only';

export interface Series {
  id: string;
  slug: string;
  title: string;
  genre: string;
  releaseYear: string;
  description: string;
  coverUrl: string;
  backdropUrl: string;
  seasonsCount: number;
  totalEpisodes: number;
  rating: string;
  cast: string[];
  director: string;
  featured: boolean;
}

// This component renders series data with cached data
export async function CachedSeriesData({ slug }: { slug: string }) {
  const series = await fetchCachedSeriesBySlug(slug);

  return {
    series,
    fetchedAt: new Date().toISOString(),
  };
}

// Function to fetch all public series
export async function fetchCachedPublicSeries(): Promise<Series[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch series data:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching series data:', error);
    return [];
  }
}

export async function CachedPublicSeriesData(): Promise<{ series: Series[] }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch series data:', response.statusText);
      return { series: [] };
    }

    const series = await response.json();
    return { series };
  } catch (error) {
    console.error('Error fetching series data:', error);
    return { series: [] };
  }
}

export async function fetchCachedSeriesBySlug(slug: string): Promise<Series | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch series by slug:', response.statusText);
      return null;
    }

    const series = await response.json();
    return series;
  } catch (error) {
    console.error('Error fetching series by slug:', error);
    return null;
  }
}

// Episode interface for caching
export interface Episode {
  id: string;
  number: number;
  title: string;
  description: string;
  runtime: number;
  runtimeFormatted: string;
  airDate: string;
  coverUrl: string;
  streamingUrl: string;
  qualities?: Array<{
    quality: string;
    url: string;
    bitrate: number;
  }>;
  series: {
    id: string;
    slug: string;
    title: string;
    description: string;
    genre: string;
    genres: string[];
    releaseYear: string;
    coverUrl: string;
    backdropUrl: string;
    rating: string;
    cast: string[];
    director: string;
  };
  season: {
    id: string;
    number: number;
    title: string;
    description: string;
    releaseDate: string;
    coverUrl: string;
    episodeCount: number;
    episodes?: Array<{
      id: string;
      number: number;
      title: string;
    }>;
  };
  nextEpisode?: {
    id: string;
    number: number;
    title: string;
  };
  previousEpisode?: {
    id: string;
    number: number;
    title: string;
  };
}

// Season interface for caching
export interface Season {
  id: string;
  number: number;
  title: string;
  episodeCount: number;
  episodes: Array<{
    id: string;
    number: number;
    title: string;
  }>;
}

export async function fetchCachedEpisode(
  seriesSlug: string,
  seasonNumber: string,
  episodeNumber: string
): Promise<Episode | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${seriesSlug}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
      {
        next: { revalidate: 1800 }, // Cache for 30 minutes (episodes change less frequently than series)
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch episode:', response.statusText);
      return null;
    }

    const episode = await response.json();
    return episode;
  } catch (error) {
    console.error('Error fetching episode:', error);
    return null;
  }
}

export async function fetchCachedSeasons(seriesSlug: string): Promise<Season[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${seriesSlug}/seasons`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch seasons:', response.statusText);
      return [];
    }

    const seasons = await response.json();
    return seasons;
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
}
