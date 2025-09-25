import { NetflixBg } from '@/components/ui/netflix-bg';
import { notFound } from 'next/navigation';

import {
  CachedSeriesData,
  fetchCachedPublicSeries,
  fetchCachedSeriesBySlug,
} from '@/components/series/cached-series-data';

// Import the Series types from both sources
import {
  SeriesDetailClient,
  type Series as DetailSeries,
} from '@/components/series/series-detail-client';
import { type Series as CachedSeries } from '@/lib/data/movies-with-use-cache';

// Use the imported type
type Series = CachedSeries;

// Generate static params for popular series (optional)
export async function generateStaticParams() {
  try {
    const response = await fetch('http://localhost:3000/api/series');
    const series = await response.json();

    // Generate static params for the first 20 series
    return series.slice(0, 20).map((seriesItem: Series) => ({
      slug: seriesItem.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Fetch series data with caching using 'use cache' directive
async function getSeries(slug: string): Promise<Series | null> {
  return fetchCachedSeriesBySlug(slug);
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const series = await getSeries((await params).slug);

  if (!series) {
    return {
      title: 'Series Not Found | CinemaX',
      description: 'The requested series could not be found.',
    };
  }

  return {
    title: `${series.title} | CinemaX`,
    description: series.description,
    openGraph: {
      title: series.title,
      description: series.description,
      images: [series.backdropUrl, series.coverUrl],
      type: 'video.tv_show',
    },
    twitter: {
      card: 'summary_large_image',
      title: series.title,
      description: series.description,
      images: [series.backdropUrl],
    },
  };
}

export default async function SeriesDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { series } = await CachedSeriesData({ slug: resolvedParams.slug });

  // Fetch all series for similar series recommendations
  const allSeries = await fetchCachedPublicSeries();

  if (!series) {
    notFound();
  }

  // Transform the series data to match the expected format for SeriesDetailClient
  const transformedSeries = {
    ...series,
    // Transform showtimes from string[] to the expected Record format if it exists
    showtimes: transformShowtimes(series.showtimes),
  } as DetailSeries;

  // Transform all series for similar series recommendations
  const transformedAllSeries = allSeries.map((s) => ({
    ...s,
    showtimes: transformShowtimes(s.showtimes),
  })) as DetailSeries[];

  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <SeriesDetailClient series={transformedSeries} allSeries={transformedAllSeries} />
    </NetflixBg>
  );
}

// Helper function to transform showtimes from string[] to the expected Record format
function transformShowtimes(showtimes?: string[]):
  | Record<
      string,
      Array<{
        id: string;
        time: string;
        startTime: Date;
        endTime: Date;
        theater: string;
        cinema: string;
        price: number;
        available: number;
      }>
    >
  | undefined {
  // For series, we don't have showtimes like movies, so return undefined
  return undefined;
}
