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
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'development' && !process.env.VERCEL)
  ) {
    console.log('Build time: Skipping featured series fetch');
    return [];
  }

  try {
    // Fetch with revalidation every 10 minutes (600 seconds)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series`,
      { next: { revalidate: 600 } }
    );
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
