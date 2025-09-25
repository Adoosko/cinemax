import { SeasonClient } from '@/components/series/season-client';
import { notFound } from 'next/navigation';

interface SeasonPageProps {
  params: Promise<{
    slug: string;
    seasonNumber: string;
  }>;
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
  const { slug, seasonNumber } = await params;

  try {
    // Fetch season data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/series/${slug}/seasons/${seasonNumber}`,
      { cache: 'no-store' }
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
