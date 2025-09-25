'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Episode {
  id: string;
  number: number;
  title: string;
  description: string;
  runtime: number;
  runtimeFormatted: string;
  airDate: string;
  coverUrl: string;
  videoUrl: string;
}

interface Season {
  id: string;
  number: number;
  title: string;
  description: string;
  releaseDate: string;
  coverUrl: string;
  series: {
    id: string;
    slug: string;
    title: string;
    description: string;
    genre: string;
    genres: string[];
    releaseYear: string;
    coverUrl: string;
    backdropUrl: string;
    rating: string;
    cast: string[];
    director: string;
  };
  episodes: Episode[];
  episodeCount: number;
  totalRuntime: number;
}

interface SeasonClientProps {
  season: Season;
}

export function SeasonClient({ season }: SeasonClientProps) {
  const router = useRouter();
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());
  const [episodeProgress, setEpisodeProgress] = useState<Record<string, number>>({});

  // Fetch watch history for episodes
  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        const response = await fetch('/api/watch/history');
        if (response.ok) {
          const data = await response.json();
          const watched = new Set<string>();
          const progress: Record<string, number> = {};

          data.watchHistory.forEach((h: any) => {
            if (h.completed) {
              watched.add(h.episodeId);
              progress[h.episodeId] = 1.0;
            } else if (h.progress > 0) {
              progress[h.episodeId] = h.progress;
            }
          });

          setWatchedEpisodes(watched);
          setEpisodeProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      }
    };

    fetchWatchHistory();
  }, []);

  const getNextUnwatchedEpisode = () => {
    return season.episodes.find((ep) => !watchedEpisodes.has(ep.id));
  };

  const nextEpisode = getNextUnwatchedEpisode() || season.episodes[0];

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] lg:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${season.series.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/90 via-netflix-black/60 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            variant="glass"
            size="icon"
            aria-label="Back to series"
            onClick={() => router.push(`/series/${season.series.slug}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href={`/series/${season.series.slug}`}
                className="text-white/60 hover:text-white transition-colors"
              >
                {season.series.title}
              </Link>
              <span className="text-white/40">•</span>
              <span className="text-white font-medium">{season.title}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{season.title}</h1>

            <div className="flex flex-wrap gap-4 items-center mb-6">
              <Badge variant="outline" className="bg-netflix-dark-red">
                {season.episodeCount} Episode{season.episodeCount !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">{season.series.rating}</Badge>
              <Badge variant="outline">{season.series.genre}</Badge>
            </div>

            <p className="text-white/80 text-sm lg:text-base leading-relaxed mb-8 max-w-2xl">
              {season.description}
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/series/${season.series.slug}/season/${season.number}/episode/${nextEpisode.number}`}
              >
                <Button size="lg" variant="premium">
                  <Play className="w-4 h-4 mr-2" />
                  {watchedEpisodes.has(nextEpisode.id) ? 'Continue Watching' : 'Watch Now'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-4">
          {season.episodes.map((episode, index) => {
            const isWatched = watchedEpisodes.has(episode.id);
            const isNext = episode.id === nextEpisode.id;

            return (
              <Card
                key={episode.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                <div className="flex">
                  {/* Episode Thumbnail */}
                  <div className="relative w-48 h-28 flex-shrink-0">
                    <img
                      src={episode.coverUrl}
                      alt={episode.title}
                      className="w-full h-full object-cover"
                    />
                    {isWatched && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    {isNext && !isWatched && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-netflix-red text-white text-xs">NEXT</Badge>
                      </div>
                    )}
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-netflix-red font-bold text-lg">
                            {episode.number}
                          </span>
                          <h3 className="text-white font-semibold text-lg">{episode.title}</h3>
                        </div>

                        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
                          {episode.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{episode.runtimeFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(episode.airDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {episodeProgress[episode.id] !== undefined &&
                          episodeProgress[episode.id] > 0 && (
                            <div className="mt-3">
                              <div className="w-full bg-white/20 rounded-full h-1">
                                <div
                                  className="bg-netflix-red h-1 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(episodeProgress[episode.id] * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <div className="text-xs text-white/60 mt-1">
                                {isWatched
                                  ? 'Watched'
                                  : `${Math.round(episodeProgress[episode.id] * 100)}% watched`}
                              </div>
                            </div>
                          )}
                      </div>

                      <Link
                        href={`/series/${season.series.slug}/season/${season.number}/episode/${episode.number}`}
                      >
                        <Button
                          variant={isWatched ? 'outline' : 'premium'}
                          size="sm"
                          className={
                            isWatched ? 'border-white/20 text-white/60 hover:text-white' : ''
                          }
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {isWatched ? 'Rewatch' : isNext ? 'Continue' : 'Watch'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
