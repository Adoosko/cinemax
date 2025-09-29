import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import for the client component - now with PPR support
const DynamicWatchPageClient = dynamic(
  () =>
    import('@/components/movies/watch-page-client').then((mod) => ({
      default: mod.WatchPageClient,
    })),
  {
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading player...</p>
        </div>
      </div>
    ),
    // Enable PPR - prerender static parts, hydrate dynamic parts
    ssr: true,
  }
);

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

// Server component to prerender movie data
async function getMovieData(slug: string) {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'https://cinemx.adrianfinik.sk';

    const url = `${baseUrl}/api/movies/${slug}/video?direct=true`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable caching for PPR
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movie: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.movie) {
      throw new Error('Movie not found');
    }

    return data.movie;
  } catch (error) {
    console.error('Error fetching movie:', error);
    throw error;
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  // Prerender movie data on the server
  const movie = await getMovieData(slug);

  // Render immediately with prerendered data
  return <DynamicWatchPageClient slug={slug} initialMovieData={movie} />;
}

// Generate metadata on the server
export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const movie = await getMovieData(slug);

    return {
      title: `Watch ${movie.title} | CINEMX`,
      description: movie.description || 'Stream movies in high quality on CINEMX.',
      openGraph: {
        title: movie.title,
        description: movie.description || 'Stream movies in high quality on CINEMX.',
        images: movie.backdrop ? [{ url: movie.backdrop }] : [],
      },
    };
  } catch {
    return {
      title: `Watch Movie | CINEMX`,
      description: 'Stream movies in high quality on CINEMX.',
    };
  }
}
