'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
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

interface EpisodeNavigationProps {
  series: Series;
  currentSeason: Season;
  currentEpisode: Episode;
  allSeasons: Season[];
}

export function EpisodeNavigation({
  series,
  currentSeason,
  currentEpisode,
  allSeasons,
}: EpisodeNavigationProps) {
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSeriesDropdown(false);
      setShowSeasonDropdown(false);
      setShowEpisodeDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
      {/* Series Selector */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSeriesDropdown(!showSeriesDropdown);
            setShowSeasonDropdown(false);
            setShowEpisodeDropdown(false);
          }}
          className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
        >
          <span className="truncate max-w-32">{series.title}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showSeriesDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 min-w-48 max-h-64 overflow-y-auto">
            <Link
              href={`/series/${series.slug}`}
              className="block px-4 py-3 text-white hover:bg-white/10 transition-colors border-b border-white/10"
            >
              <div className="font-medium">{series.title}</div>
              <div className="text-xs text-white/60">View series details</div>
            </Link>
            {/* Could add related series here if available */}
          </div>
        )}
      </div>

      {/* Separator */}
      <ChevronRight className="w-3 h-3 text-white/40" />

      {/* Season Selector */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSeasonDropdown(!showSeasonDropdown);
            setShowSeriesDropdown(false);
            setShowEpisodeDropdown(false);
          }}
          className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
        >
          <span>{currentSeason.title}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showSeasonDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 min-w-48 max-h-64 overflow-y-auto">
            {allSeasons.map((season) => (
              <Link
                key={season.id}
                href={`/series/${series.slug}/season/${season.number}`}
                className={`block px-4 py-3 hover:bg-white/10 transition-colors ${
                  season.id === currentSeason.id
                    ? 'bg-netflix-red/20 text-netflix-red'
                    : 'text-white'
                }`}
              >
                <div className="font-medium">{season.title}</div>
                <div className="text-xs text-white/60">{season.episodeCount} episodes</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <ChevronRight className="w-3 h-3 text-white/40" />

      {/* Episode Selector */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEpisodeDropdown(!showEpisodeDropdown);
            setShowSeriesDropdown(false);
            setShowSeasonDropdown(false);
          }}
          className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
        >
          <span>Episode {currentEpisode.number}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showEpisodeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 min-w-64 max-h-80 overflow-y-auto">
            {currentSeason.episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/series/${series.slug}/season/${currentSeason.number}/episode/${episode.number}`}
                className={`block px-4 py-3 hover:bg-white/10 transition-colors ${
                  episode.id === currentEpisode.id
                    ? 'bg-netflix-red/20 text-netflix-red'
                    : 'text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-xs font-bold">
                    {episode.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{episode.title}</div>
                    <div className="text-xs text-white/60">Episode {episode.number}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
