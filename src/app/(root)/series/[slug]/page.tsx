import { NetflixBg } from '@/components/ui/netflix-bg';
import { notFound } from 'next/navigation';

import {
  CachedSeriesData,
  fetchCachedPublicSeries,
  fetchCachedSeriesBySlug,
} from '@/components/series/cached-series-data';

// Import the Series types
import { type Series } from '@/components/series/cached-series-data';
import { SeriesDetailClient } from '@/components/series/series-detail-client';

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

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

  // Use the series data directly
  const transformedSeries = series;

  // Use all series directly
  const transformedAllSeries = allSeries;

  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <SeriesDetailClient series={transformedSeries} allSeries={transformedAllSeries} />
    </NetflixBg>
  );
}
