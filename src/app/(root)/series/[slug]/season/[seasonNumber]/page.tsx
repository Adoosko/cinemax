import { SeasonClient } from '@/components/series/season-client';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

interface SeasonPageProps {
  params: Promise<{
    slug: string;
    seasonNumber: string;
  }>;
}

// Enable PPR and ISR for optimal performance
export const experimental_ppr = true;
export const revalidate = 3600;

// Generate static params for all seasons
export async function generateStaticParams() {
  const prisma = new PrismaClient();

  try {
    const series = await prisma.series.findMany({
      where: { isActive: true, isPublished: true },
      select: {
        slug: true,
        seasons: {
          where: { isActive: true },
          select: { number: true },
        },
      },
    });

    const params: { slug: string; seasonNumber: string }[] = [];

    for (const seriesItem of series) {
      for (const season of seriesItem.seasons) {
        params.push({
          slug: seriesItem.slug,
          seasonNumber: season.number.toString(),
        });
      }
    }

    return params;
  } catch (error) {
    console.error('Failed to generate static params for seasons:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SeasonPageProps) {
  const { slug, seasonNumber } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}/seasons/${seasonNumber}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return {
        title: 'Season Not Found | CinemaX',
        description: 'The requested season could not be found.',
      };
    }

    const season = await response.json();

    return {
      title: `${season.series.title} - ${season.title} | CinemaX`,
      description:
        season.description || `Watch all episodes of ${season.title} from ${season.series.title}`,
    };
  } catch (error) {
    return {
      title: 'Season | CinemaX',
      description: 'Watch TV series seasons online',
    };
  }
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  // During build time, return not found to avoid fetch errors
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'development' && !process.env.VERCEL)
  ) {
    notFound();
  }

  const { slug, seasonNumber } = await params;

  try {
    // Fetch season data with ISR
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}/seasons/${seasonNumber}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      notFound();
    }

    const season = await response.json();

    return <SeasonClient season={season} />;
  } catch (error) {
    console.error('Failed to fetch season:', error);
    notFound();
  }
}
