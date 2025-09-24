import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NetflixBg } from '@/components/ui/netflix-bg';

export default function NotFound() {
  return (
    <NetflixBg variant="solid" className="min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-netflix-red mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-4">Movie Not Found</h2>
          <p className="text-netflix-text-gray mb-8 max-w-md">
            The movie you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/movies">
            <button className="bg-netflix-red hover:bg-netflix-dark-red text-white px-8 py-3 font-semibold transition-colors inline-flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Movies
            </button>
          </Link>
        </div>
      </div>
    </NetflixBg>
  );
}
