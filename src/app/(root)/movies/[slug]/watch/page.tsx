import { WatchPageClient } from '@/components/movies/watch-page-client';
import { Metadata } from 'next';

// Force dynamic rendering for watch pages
export const dynamic = 'force-dynamic';

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  // Render immediately - all data fetching and auth happens client-side
  return <WatchPageClient slug={slug} />;
}

// Basic metadata - will be updated client-side if needed
export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: 'Watch Movie | CINEMX',
    description: 'Stream movies in high quality on CINEMX.',
  };
}
