'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyComponent } from '@/components/ui/lazy-component';
import { useSeriesContinueWatching } from '@/lib/hooks/use-series-continue-watching';
import { ArrowLeft, Heart, Play, Share, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Lazy load heavy components
const DynamicSeriesComments = dynamic(
  () => import('./series-comments').then((mod) => ({ default: mod.SeriesComments })),
  { ssr: false }
);

const DynamicSeriesRecommendations = dynamic(
  () => import('./series-recommendations').then((mod) => ({ default: mod.SeriesRecommendations })),
  { ssr: false }
);

// Import the Series type from the context
import { Series } from './series-context';

interface SeriesDetailClientProps {
  series: Series;
  allSeries: Series[];
}

export function SeriesDetailClient({ series, allSeries }: SeriesDetailClientProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const { continueWatching } = useSeriesContinueWatching();

  // Find if user has progress in this series
  const seriesProgress = continueWatching.find((item) => item.seriesId === series.id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: series.title,
          text: series.description,
          url: window.location.href,
        });
      } catch {
        // fallback: copy url
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleFavorite = () => setIsFavorite((prev) => !prev);

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hero */}
      <div className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
        {series.backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${series.backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 via-netflix-black/60 to-transparent" />
        {/* Actions */}
        <div className="absolute top-6 left-6 z-20 flex gap-2">
          <Button variant="glass" size="icon" aria-label="Back" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <Button
            variant={isFavorite ? 'outline' : 'ghost'}
            size="icon"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={toggleFavorite}
            className={isFavorite ? 'text-netflix-red border-netflix-red' : 'text-white'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share"
            onClick={handleShare}
            className="text-white"
          >
            <Share className="w-5 h-5" />
          </Button>
        </div>
        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl mt-5 md:text-4xl lg:text-5xl font-bold text-white mb-3">
              {series.title}
            </h1>
            <div className="flex flex-wrap gap-4 items-center mb-5">
              <Badge variant="outline">
                <Star className="w-4 h-4 inline" /> {Number(series.rating).toFixed(1)}
              </Badge>
              <Badge variant="outline">{series.releaseYear}</Badge>
              <Badge variant="outline" className="bg-netflix-dark-red">
                {series.seasonsCount} Season{series.seasonsCount !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">{series.totalEpisodes} Episodes</Badge>
            </div>
            <p className="text-white/80 text-xs md:text-sm lg:text-base leading-relaxed mb-8 max-w-xl">
              {series.description}
            </p>

            <div className="flex gap-3 flex-wrap">
              {seriesProgress ? (
                <Link
                  href={`/series/${series.slug}/season/${seriesProgress.seasonNumber}/episode/${seriesProgress.episodeNumber}`}
                >
                  <Button size={'sm'} variant={'premium'}>
                    <Play className="w-4 h-4 mr-2" /> Resume S{seriesProgress.seasonNumber}E
                    {seriesProgress.episodeNumber} at{' '}
                    {Math.floor(seriesProgress.positionSeconds / 60)}:
                    {(seriesProgress.positionSeconds % 60).toString().padStart(2, '0')}
                  </Button>
                </Link>
              ) : (
                <Link href={`/series/${series.slug}/season/1/episode/1`}>
                  <Button size={'sm'} variant={'premium'}>
                    <Play className="w-4 h-4 mr-2" /> Watch Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Details */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-transparent border-0 mb-6 p-5">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Cast & Crew</h3>
              <div className="flex gap-6 mb-3">
                <span className="text-netflix-text-gray w-20 text-xs md:text-sm lg:text-base">
                  Director:
                </span>
                <span className="text-white text-xs md:text-sm lg:text-base">
                  {series.director || 'Various Directors'}
                </span>
              </div>
              <div className="flex gap-6">
                <span className="text-netflix-text-gray w-20 text-xs md:text-sm lg:text-base">
                  Cast:
                </span>
                <span className="text-white text-xs md:text-sm lg:text-base">
                  {series.cast.join(', ')}
                </span>
              </div>
            </div>
          </Card>
        </div>
        {/* Sidebar Info */}
        <div>
          <Card className="bg-transparent border-0 gray p-6">
            <h3 className="text-lg font-bold text-white mb-4">Series Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Release Year:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {series.releaseYear}
                </span>
              </div>
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Seasons:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {series.seasonsCount}
                </span>
              </div>
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Episodes:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {series.totalEpisodes}
                </span>
              </div>
              <div>
                <span className="text-netflix-text-gray text-xs md:text-sm lg:text-base">
                  Rating:
                </span>
                <span className="text-white ml-2 text-xs md:text-sm lg:text-base">
                  {Number(series.rating).toFixed(1)}/10
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Comments Section */}
      <LazyComponent
        fallback={
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="h-8 w-32 bg-white/10 rounded mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto px-6 py-12">
          <DynamicSeriesComments seriesSlug={series.slug} />
        </div>
      </LazyComponent>

      {/* Recommended Series */}
      <LazyComponent
        fallback={
          <div className="bg-netflix-black pt-4 px-2">
            <div className="h-8 w-40 bg-white/10 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/10 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        }
      >
        <div className="bg-netflix-black pt-4 px-2">
          <DynamicSeriesRecommendations allSeries={allSeries} currentSeriesId={series.id} />
        </div>
      </LazyComponent>
    </div>
  );
}
