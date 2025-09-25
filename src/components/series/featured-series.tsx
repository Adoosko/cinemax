import { FeaturedSeriesClient } from './featured-series-client';

interface Series {
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

async function getFeaturedSeries() {
  // During build time, return empty array to avoid fetch errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Build time: Skipping featured series fetch');
    return [];
  }

  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://cinemx.adrianfinik.sk'
        : 'http://localhost:3000';
    // Fetch with revalidation every 10 minutes (600 seconds)
    const response = await fetch(`${baseUrl}/api/series`, { next: { revalidate: 600 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch series: ${response.status}`);
    }
    const series = await response.json();
    // Get 5 latest series for hero carousel
    return series.slice(0, 5);
  } catch (error) {
    console.error('Error fetching featured series:', error);
    return [];
  }
}

export async function FeaturedSeries() {
  const heroSeries = await getFeaturedSeries();

  return <FeaturedSeriesClient heroSeries={heroSeries} />;
}
