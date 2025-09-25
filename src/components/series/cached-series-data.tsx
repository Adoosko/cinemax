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
