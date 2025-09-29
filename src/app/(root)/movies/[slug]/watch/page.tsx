import WatchPageServer from '@/components/movies/watch-page-server';

// PPR configuration - static parts pre-rendered at build time, dynamic parts on-demand
export const experimental_ppr = true;

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  return <WatchPageServer params={params} />;
}

// Re-export metadata generation from server component
export { generateMetadata } from '@/components/movies/watch-page-server';
