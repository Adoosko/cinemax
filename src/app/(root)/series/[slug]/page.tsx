import { NetflixBg } from '@/components/ui/netflix-bg';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

import {
  CachedSeriesData,
  fetchCachedPublicSeries,
  fetchCachedSeriesBySlug,
} from '@/components/series/cached-series-data';

// Import the Series types
import { type Series } from '@/components/series/cached-series-data';
import { SeriesDetailClient } from '@/components/series/series-detail-client';

// PPR configuration for dynamic series pages - static parts pre-rendered, dynamic parts on-demand
export const experimental_ppr = true;

// Generate static params for all active series
export async function generateStaticParams() {
  const prisma = new PrismaClient();

  try {
    const series = await prisma.series.findMany({
      where: { isActive: true, isPublished: true },
      select: { slug: true },
    });

    return series.map((seriesItem) => ({
      slug: seriesItem.slug,
    }));
  } catch (error) {
    console.error('Failed to generate static params for series:', error);
    return [];
  } finally {
    await prisma.$disconnect();
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
      title: 'Series Not Found | CINEMX',
      description: 'The requested series could not be found.',
    };
  }

  return {
    title: `${series.title} | CINEMX`,
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
