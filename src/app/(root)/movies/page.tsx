// pages/movies.tsx (or app/movies/page.tsx with App Router)

import MoviePageSkeleton from '@/components/movies/movies-page-skeleton';
import { NetflixBg } from '@/components/ui/netflix-bg';
import dynamic from 'next/dynamic';
import { Permanent_Marker } from 'next/font/google';
import { Suspense } from 'react';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap', // Ensures font is visible ASAP, no layout shifts
});

// Best practice: dynamically import large content chunks
const MoviesPageContent = dynamic(() => import('@/components/movies/movies-page-content'), {
  ssr: true,
  loading: () => <MoviePageSkeleton />,
});

// Page Component
export const experimental_ppr = true;

export default function MoviesPage() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <div className="relative pt-20 md:pt-12 py-12 md:py-24 bg-black overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className={`text-4xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-6 tracking-tight ${permanentMarker.className}`}
          >
            MOVIES
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Explore classic movies from the archive
          </p>
          <div className="mt-4 md:mt-8 flex justify-center">
            <div className="w-16 md:w-24 h-1 bg-netflix-red rounded-full" />
          </div>
        </div>
      </div>

      {/* Dynamic content below: streamed with Suspense
          All dynamic data is chunked for optimal PPR and INP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Suspense fallback={<MoviePageSkeleton />}>
          <MoviesPageContent />
        </Suspense>
      </div>
    </NetflixBg>
  );
}
