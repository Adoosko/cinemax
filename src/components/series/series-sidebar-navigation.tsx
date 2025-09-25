'use client';

import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // shadcn/ui sheet
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, Play, Tv } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Episode {
  id: string;
  number: number;
  title: string;
}

interface Season {
  id: string;
  number: number;
  title: string;
  episodeCount: number;
  episodes: Episode[];
}

interface Series {
  id: string;
  slug: string;
  title: string;
}

interface SeriesSidebarNavigationProps {
  series: Series;
  allSeasons: Season[];
  currentSeason: Season;
  currentEpisodeId: string;
}

export function SeriesSidebarNavigation({
  series,
  allSeasons,
  currentSeason,
  currentEpisodeId,
}: SeriesSidebarNavigationProps) {
  const [episodeProgress, setEpisodeProgress] = useState<Record<string, number>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch watch history for progress indicators
  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        const response = await fetch('/api/watch/history');
        if (response.ok) {
          const data = await response.json();
          const progress: Record<string, number> = {};
          data.watchHistory.forEach((h: any) => {
            if (h.completed) {
              progress[h.episodeId] = 1.0;
            } else if (h.progress > 0) {
              progress[h.episodeId] = h.progress;
            }
          });
          setEpisodeProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      }
    };
    fetchWatchHistory();
  }, []);

  const getEpisodeStatus = (episodeId: string) => {
    const progress = episodeProgress[episodeId];
    if (progress === 1.0) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

  // Mobile drawer trigger
  const MobileSheetTrigger = (
    <SheetTrigger asChild>
      <button
        className="fixed left-3 top-14 z-50 flex items-center px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white font-semibold backdrop-blur-lg sm:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open series navigation"
      >
        <Tv className="w-5 h-5 mr-2" />
        Browse Episodes
      </button>
    </SheetTrigger>
  );

  // The sidebar content (reusable for desktop and the Sheet)
  const SidebarContent = (
    <aside className="h-full w-full flex flex-col bg-black/80 backdrop-blur border-r border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold truncate text-lg">{series.title}</h2>
          <p className="text-white/60 text-sm">
            {allSeasons.length} Season{allSeasons.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-4 px-4">
          {allSeasons.map((season) => (
            <div key={season.id}>
              <div className="flex items-center mb-1 gap-2">
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white font-normal"
                >{`Season ${season.number}`}</Badge>
                <span className="text-white/40 ml-2 text-xs">{season.episodeCount} ep.</span>
              </div>
              <div className="space-y-1 pl-2 mt-2">
                {season.episodes.map((episode) => {
                  const status = getEpisodeStatus(episode.id);
                  const isCurrentEpisode = episode.id === currentEpisodeId;
                  return (
                    <Link
                      key={episode.id}
                      href={`/series/${series.slug}/season/${season.number}/episode/${episode.number}`}
                      className={cn(
                        'flex items-center space-x-3 p-2 rounded-lg transition-colors text-sm',
                        isCurrentEpisode
                          ? 'bg-netflix-red/15 text-netflix-red   font-semibold shadow'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {/* Status Icon */}
                      <span>
                        {status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : status === 'in-progress' ? (
                          <Clock className="w-4 h-4 text-netflix-red" />
                        ) : (
                          <Play className="w-4 h-4 text-white/50" />
                        )}
                      </span>
                      {/* Episode Info */}
                      <span className="truncate flex-1">
                        {episode.number}. {episode.title}
                      </span>
                      {/* Progress Bar/Percent */}
                      {status === 'in-progress' && episodeProgress[episode.id] != null && (
                        <div className="flex items-center gap-1 w-16">
                          <div className="flex-1 h-1 bg-white/20 rounded-full mr-2">
                            <div
                              className="bg-netflix-red h-1 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(episodeProgress[episode.id] * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-netflix-red text-xs">
                            {Math.round(episodeProgress[episode.id] * 100)}%
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-white/10 text-white/40 text-xs text-center hidden sm:block">
        Watching: Episode{' '}
        {currentSeason.episodes.find((e) => e.id === currentEpisodeId)?.number || '?'}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile: Sheet (Drawer) for series navigation */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          {MobileSheetTrigger}
          <SheetContent
            side="left"
            className="p-0 w-[320px] max-w-full bg-black/90 border-r border-white/10"
          >
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop/tablet: sidebar as part of layout */}
      <div className="hidden sm:block w-[320px] h-full">{SidebarContent}</div>
    </>
  );
}
