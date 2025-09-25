'use client';

import { EpisodeComments } from './episode-comments';
import { EpisodeVideoPlayer } from './episode-video-player';

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

interface EpisodePlayerClientProps {
  episode: Episode;
}

export function EpisodePlayerClient({ episode }: EpisodePlayerClientProps) {
  return (
    <div className="min-h-screen bg-black">
      {/* Video Player - Full width with minimal padding */}
      <section className="w-full py-4">
        <div className="max-w-6xl mx-auto px-0 sm:px-4">
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
          />
        </div>
      </section>

      {/* Episode Info and Comments */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Episode Info */}
          <div className="lg:col-span-2">
            {/* Episode Header */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={episode.coverUrl}
                    alt={episode.title}
                    className="w-32 h-48 object-cover rounded-xl shadow-2xl"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        S{episode.season.number}E{episode.number}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span>{episode.runtimeFormatted}</span>
                        <span>•</span>
                        <span>{episode.series.rating}</span>
                      </div>
                      <div className="text-white/40 text-xs">
                        {episode.series.title} • {episode.series.releaseYear}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                    {episode.title}
                  </h1>

                  <p className="text-white/80 text-lg leading-relaxed mb-6">
                    {episode.description}
                  </p>

                  {/* Series Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                        <span className="text-netflix-red text-xs">★</span>
                      </div>
                      <span className="text-white/60">{episode.series.rating}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                        <span className="text-white/60 text-xs">📅</span>
                      </div>
                      <span className="text-white/60">{episode.series.releaseYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                        <span className="text-white/60 text-xs">🎭</span>
                      </div>
                      <span className="text-white/60">{episode.series.genre}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <EpisodeComments
              seriesSlug={episode.series.slug}
              seasonNumber={episode.season.number}
              episodeNumber={episode.number}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Episode Navigation */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                  <span className="text-netflix-red text-sm">▶</span>
                </div>
                <h4 className="text-white font-semibold">Continue Watching</h4>
              </div>

              <div className="space-y-3">
                {episode.previousEpisode && (
                  <a
                    href={`/series/${episode.series.slug}/season/${episode.season.number}/episode/${episode.previousEpisode.number}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-white/5 hover:border-white/10"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-netflix-red/20 transition-colors">
                      <span className="text-white/60 group-hover:text-netflix-red text-sm">◀</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">Previous Episode</div>
                      <div className="text-white/60 text-xs truncate">
                        {episode.previousEpisode.number}. {episode.previousEpisode.title}
                      </div>
                    </div>
                  </a>
                )}

                {episode.nextEpisode && (
                  <a
                    href={`/series/${episode.series.slug}/season/${episode.season.number}/episode/${episode.nextEpisode.number}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-white/5 hover:border-white/10"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-netflix-red/20 transition-colors">
                      <span className="text-white/60 group-hover:text-netflix-red text-sm">▶</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">Next Episode</div>
                      <div className="text-white/60 text-xs truncate">
                        {episode.nextEpisode.number}. {episode.nextEpisode.title}
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Season Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                  <span className="text-netflix-red text-sm">📺</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">{episode.season.title}</h4>
                  <p className="text-white/60 text-xs">Season {episode.season.number}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Episodes</span>
                  <span className="text-white">{episode.season.episodeCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">This Episode</span>
                  <span className="text-netflix-red font-medium">#{episode.number}</span>
                </div>
              </div>
            </div>

            {/* Series Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-netflix-red/20 rounded-lg flex items-center justify-center">
                  <span className="text-netflix-red text-sm">🎬</span>
                </div>
                <h4 className="text-white font-semibold">{episode.series.title}</h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Genre</span>
                  <span className="text-white">{episode.series.genre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Rating</span>
                  <span className="text-white">{episode.series.rating}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Year</span>
                  <span className="text-white">{episode.series.releaseYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
