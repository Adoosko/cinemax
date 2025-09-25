import { EpisodePlayerClient } from '@/components/series/episode-player-client';
import { notFound } from 'next/navigation';

interface EpisodePageProps {
  params: Promise<{
    slug: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
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
    // Fetch episode data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      notFound();
    }

    const episode = await response.json();

    return <EpisodePlayerClient episode={episode} />;
  } catch (error) {
    console.error('Failed to fetch episode:', error);
    notFound();
  }
}
