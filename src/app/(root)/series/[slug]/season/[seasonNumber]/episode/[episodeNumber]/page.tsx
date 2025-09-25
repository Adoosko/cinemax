import { fetchCachedEpisode, fetchCachedSeasons } from '@/components/series/cached-series-data';
import { EpisodePlayerClient } from '@/components/series/episode-player-client';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

interface EpisodePageProps {
  params: Promise<{
    slug: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
}

// Enable PPR and ISR for optimal performance
export const experimental_ppr = true;
export const revalidate = 3600;

// Generate static params for all episodes
export async function generateStaticParams() {
  const prisma = new PrismaClient();

  try {
    const series = await prisma.series.findMany({
      where: { isActive: true, isPublished: true },
      select: {
        slug: true,
        seasons: {
          where: { isActive: true },
          select: {
            number: true,
            episodes: {
              where: { isActive: true },
              select: { number: true },
            },
          },
        },
      },
    });

    const params: { slug: string; seasonNumber: string; episodeNumber: string }[] = [];

    for (const seriesItem of series) {
      for (const season of seriesItem.seasons) {
        for (const episode of season.episodes) {
          params.push({
            slug: seriesItem.slug,
            seasonNumber: season.number.toString(),
            episodeNumber: episode.number.toString(),
          });
        }
      }
    }

    return params;
  } catch (error) {
    console.error('Failed to generate static params for episodes:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EpisodePageProps) {
  const { slug, seasonNumber, episodeNumber } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return {
        title: 'Episode Not Found | CinemaX',
        description: 'The requested episode could not be found.',
      };
    }

    const episode = await response.json();

    return {
      title: `${episode.series.title} - ${episode.season.title} Episode ${episode.number} | CinemaX`,
      description: episode.description || `Watch ${episode.title} from ${episode.series.title}`,
    };
  } catch (error) {
    return {
      title: 'Episode | CinemaX',
      description: 'Watch TV series episodes online',
    };
  }
}

export default async function EpisodeWatchPage({ params }: EpisodePageProps) {
  const { slug, seasonNumber, episodeNumber } = await params;

  try {
    // Fetch episode data with caching
    const episode = await fetchCachedEpisode(slug, seasonNumber, episodeNumber);

    if (!episode) {
      notFound();
    }

    // Fetch all seasons for navigation with caching
    const allSeasons = await fetchCachedSeasons(slug);

    return <EpisodePlayerClient episode={episode} allSeasons={allSeasons} />;
  } catch (error) {
    console.error('Failed to fetch episode:', error);
    notFound();
  }
}
