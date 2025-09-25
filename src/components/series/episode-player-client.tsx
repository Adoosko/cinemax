'use client';

import { EpisodeComments } from './episode-comments';
import { EpisodeVideoPlayer } from './episode-video-player';
import { SeriesSidebarNavigation } from './series-sidebar-navigation';

interface Episode {
  id: string;
  number: number;
  title: string;
  description: string;
  runtime: number;
  runtimeFormatted: string;
  airDate: string;
  coverUrl: string;
  streamingUrl: string;
  qualities?: Array<{
    quality: string;
    url: string;
    bitrate: number;
  }>;
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
  season: {
    id: string;
    number: number;
    title: string;
    description: string;
    releaseDate: string;
    coverUrl: string;
    episodeCount: number;
    episodes?: Array<{
      id: string;
      number: number;
      title: string;
    }>;
  };
  nextEpisode?: {
    id: string;
    number: number;
    title: string;
  };
  previousEpisode?: {
    id: string;
    number: number;
    title: string;
  };
}

interface Season {
  id: string;
  number: number;
  title: string;
  episodeCount: number;
  episodes: Array<{
    id: string;
    number: number;
    title: string;
  }>;
}

interface EpisodePlayerClientProps {
  episode: Episode;
  allSeasons?: Season[];
}

export function EpisodePlayerClient({ episode, allSeasons = [] }: EpisodePlayerClientProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col sm:flex-row">
      {/* Sidebar Navigation (always open on desktop/tablet, sheet/drawer on mobile handled in nav) */}
      <SeriesSidebarNavigation
        series={{
          id: episode.series.id,
          slug: episode.series.slug,
          title: episode.series.title,
        }}
        allSeasons={allSeasons}
        currentSeason={{
          id: episode.season.id,
          number: episode.season.number,
          title: episode.season.title,
          episodeCount: episode.season.episodeCount,
          episodes: episode.season.episodes || [],
        }}
        currentEpisodeId={episode.id}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* Video Player */}
        <section className="w-full py-2">
          <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <EpisodeVideoPlayer
              episodeId={episode.id}
              seriesSlug={episode.series.slug}
              seasonNumber={episode.season.number}
              episodeNumber={episode.number}
              streamingUrl={episode.streamingUrl}
              title={`${episode.series.title} - S${episode.season.number}E${episode.number}: ${episode.title}`}
              posterUrl={episode.coverUrl}
              qualities={episode.qualities || []}
              nextEpisode={episode.nextEpisode}
              autoPlayNext={true}
              episodes={episode.season.episodes || []}
              currentEpisodeId={episode.id}
            />
          </div>
        </section>

        {/* Comments Section */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <EpisodeComments
            seriesSlug={episode.series.slug}
            seasonNumber={episode.season.number}
            episodeNumber={episode.number}
          />
        </div>
      </main>
    </div>
  );
}
