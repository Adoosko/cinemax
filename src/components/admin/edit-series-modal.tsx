'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  Download,
  ImageIcon,
  Info,
  Loader,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  Tv,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EpisodeUpload } from './episode-upload';

interface EditSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSeries: (seriesData: SeriesFormData) => Promise<void>;
  series?: {
    id: string;
    title: string;
    description: string;
    releaseYear: number;
    genres: string[];
    rating?: number;
    cast: string[];
    coverUrl?: string;
    backdropUrl?: string;
    isPublished: boolean;
  };
  isNew?: boolean;
}

export interface SeriesFormData {
  title: string;
  description: string;
  releaseYear: number;
  genres: string[];
  rating: number;
  cast: string[];
  coverUrl: string;
  backdropUrl: string;
  isPublished: boolean;
  slug?: string;
}

export interface TMDBSeries {
  tmdbId: number;
  title: string;
  description: string;
  coverUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number;
  rating: number;
  genres: string[];
  cast?: string[];
}

interface TMDBSearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  order: number;
}

interface TMDBSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: TMDBGenre[];
  credits: {
    cast: TMDBCastMember[];
  };
  seasons?: TMDBSeason[];
}

interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
}

interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number;
}

interface SeasonData {
  id?: string;
  number: number;
  title?: string;
  overview?: string;
  episodeCount?: number;
  posterUrl?: string;
  episodes?: EpisodeData[];
}

interface EpisodeData {
  id?: string;
  number: number;
  title?: string;
  overview?: string;
  runtime?: number;
  stillUrl?: string;
  videoUrl?: string;
  seasonId?: string;
}

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

function EditSeriesModal({
  isOpen,
  onClose,
  onUpdateSeries,
  series,
  isNew = false,
}: EditSeriesModalProps) {
  // Form state
  const [formData, setFormData] = useState<SeriesFormData>({
    title: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    genres: [],
    rating: 0,
    cast: [],
    coverUrl: '',
    backdropUrl: '',
    isPublished: false,
  });

  // TMDB Search State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<TMDBSeries[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);

  // Other state
  const [castInput, setCastInput] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'seasons'>('details');
  const [errors, setErrors] = useState<Partial<Record<keyof SeriesFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<{
    formData: SeriesFormData;
    seasons: SeasonData[];
    episodes: EpisodeData[];
  } | null>(null);

  // Seasons and Episodes state
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>('');
  const [showEpisodeUpload, setShowEpisodeUpload] = useState(false);
  const [episodeUploadData, setEpisodeUploadData] = useState<{
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
    seriesTitle: string;
    episodeTitle: string;
  } | null>(null);

  // TMDB Episode Search State
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');
  const [episodeSearchResults, setEpisodeSearchResults] = useState<TMDBEpisode[]>([]);
  const [episodeSearching, setEpisodeSearching] = useState(false);
  const [showEpisodeSearchResults, setShowEpisodeSearchResults] = useState(false);
  const [selectedEpisodeForSearch, setSelectedEpisodeForSearch] = useState<string>('');

  // TMDB Search Functions
  const searchTMDB = async (query: string) => {
    if (!query.trim()) return;

    setTmdbSearching(true);
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=tv`);
      if (!response.ok) throw new Error('Failed to search TMDB');

      const data = await response.json();
      const series =
        (data.results as TMDBSearchResult[])?.map((item) => ({
          tmdbId: item.id,
          title: item.name,
          description: item.overview,
          coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropUrl: item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : null,
          releaseYear: item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : new Date().getFullYear(),
          rating: item.vote_average || 0,
          genres: [], // Will be populated when detailed info is fetched
          cast: [], // Will be populated when detailed info is fetched
        })) || [];
      setTmdbSearchResults(series);
      setShowTmdbResults(true);
    } catch (error) {
      console.error('TMDB search error:', error);
      setTmdbSearchResults([]);
    } finally {
      setTmdbSearching(false);
    }
  };

  // TMDB Search Effects
  useEffect(() => {
    if (!tmdbSearchQuery.trim()) {
      setTmdbSearchResults([]);
      setShowTmdbResults(false);
      return;
    }

    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      searchTMDB(tmdbSearchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [tmdbSearchQuery]);

  // TMDB Episode Search Effects
  useEffect(() => {
    if (!episodeSearchQuery.trim()) {
      setEpisodeSearchResults([]);
      setShowEpisodeSearchResults(false);
      return;
    }

    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      searchTMDBEpisodes(episodeSearchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [episodeSearchQuery]);

  // TMDB Episode Search Function
  const searchTMDBEpisodes = async (query: string) => {
    if (!query.trim()) return;

    setEpisodeSearching(true);
    try {
      // For now, we'll search TMDB for episodes by episode name
      // This is a simplified implementation - in a real app you'd want more sophisticated search
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=tv`);
      if (!response.ok) throw new Error('Failed to search TMDB');

      const data = await response.json();
      // This would need to be enhanced to search for specific episodes
      // For now, we'll just show some placeholder results
      const episodes: TMDBEpisode[] = [
        {
          id: 1,
          episode_number: 1,
          name: `Episode containing "${query}"`,
          overview: 'Episode description from TMDB',
          still_path: null,
          runtime: 45,
        },
      ];
      setEpisodeSearchResults(episodes);
      setShowEpisodeSearchResults(true);
    } catch (error) {
      console.error('TMDB episode search error:', error);
      setEpisodeSearchResults([]);
    } finally {
      setEpisodeSearching(false);
    }
  };

  const populateFromTMDB = async (tmdbSeries: TMDBSeries) => {
    try {
      // Fetch detailed series info from TMDB
      const response = await fetch(`/api/tmdb/tv/${tmdbSeries.tmdbId}`);
      const seriesDetails = (await response.json()) as TMDBSeriesDetails;

      // Create seasons and episodes from TMDB data
      const seasonsData: SeasonData[] = [];
      if (seriesDetails.seasons) {
        for (const tmdbSeason of seriesDetails.seasons) {
          // Skip specials (season_number 0)
          if (tmdbSeason.season_number === 0) continue;

          const seasonData: SeasonData = {
            number: tmdbSeason.season_number,
            title: tmdbSeason.name,
            overview: tmdbSeason.overview,
            posterUrl: tmdbSeason.poster_path
              ? `https://image.tmdb.org/t/p/w300${tmdbSeason.poster_path}`
              : undefined,
            episodes: [],
          };

          // Fetch episodes for this season
          try {
            const episodesResponse = await fetch(
              `/api/tmdb/tv/${tmdbSeries.tmdbId}/season/${tmdbSeason.season_number}`
            );
            const episodesData = await episodesResponse.json();

            if (episodesData.episodes) {
              seasonData.episodes = episodesData.episodes.map((ep: any) => ({
                number: ep.episode_number,
                title: ep.name,
                overview: ep.overview,
                runtime: ep.runtime,
                stillUrl: ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : undefined,
              }));
            }
          } catch (episodeError) {
            console.warn(
              `Could not fetch episodes for season ${tmdbSeason.season_number}:`,
              episodeError
            );
            // Create placeholder episodes based on episode count
            seasonData.episodes = Array.from({ length: tmdbSeason.episode_count }, (_, i) => ({
              number: i + 1,
              title: `Episode ${i + 1}`,
              overview: '',
              runtime: 0,
            }));
          }

          seasonsData.push(seasonData);
        }
      }

      setSeasons(seasonsData);

      // Flatten episodes for easier management
      const allEpisodes = seasonsData.flatMap(
        (season) => season.episodes?.map((ep) => ({ ...ep, seasonId: season.id })) || []
      );
      setEpisodes(allEpisodes);

      setFormData({
        ...formData,
        title: tmdbSeries.title,
        description: tmdbSeries.description,
        releaseYear: tmdbSeries.releaseYear,
        genres: seriesDetails.genres?.map((genre) => genre.name) || [],
        rating: tmdbSeries.rating,
        cast: seriesDetails.credits?.cast?.slice(0, 10).map((actor) => actor.name) || [],
        coverUrl: tmdbSeries.coverUrl || '',
        backdropUrl: tmdbSeries.backdropUrl || '',
      });

      setShowTmdbResults(false);
      setTmdbSearchQuery('');
    } catch (error) {
      console.error('Error fetching series details:', error);
    }
  };

  // Fetch seasons and episodes for existing series
  const fetchSeriesDetails = async () => {
    if (!series?.id) return;

    try {
      const response = await fetch(`/api/admin/series/${series.id}`);
      const data = await response.json();

      if (data.series) {
        const seasonsData: SeasonData[] = data.series.seasons.map((season: any) => ({
          id: season.id,
          number: season.number,
          title: season.title,
          overview: season.description,
          posterUrl: season.coverUrl,
          episodes: season.episodes.map((episode: any) => ({
            id: episode.id,
            number: episode.number,
            title: episode.title,
            overview: episode.description,
            runtime: episode.duration,
            stillUrl: episode.coverUrl,
            videoUrl: episode.videoUrl,
            seasonId: season.id,
          })),
        }));

        setSeasons(seasonsData);

        // Flatten episodes for easier management
        const allEpisodes = seasonsData.flatMap(
          (season) => season.episodes?.map((ep) => ({ ...ep, seasonId: season.id })) || []
        );
        setEpisodes(allEpisodes);

        // Update original data for change tracking
        if (originalData) {
          setOriginalData({
            ...originalData,
            seasons: seasonsData,
            episodes: allEpisodes,
          });
        }

        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id!);
        }
      }
    } catch (error) {
      console.error('Error fetching series details:', error);
    }
  };

  // Check for changes
  const checkForChanges = () => {
    if (!originalData) return false;

    // Check form data changes
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalData.formData);

    // Check seasons changes
    const seasonsChanged = JSON.stringify(seasons) !== JSON.stringify(originalData.seasons);

    // Check episodes changes
    const episodesChanged = JSON.stringify(episodes) !== JSON.stringify(originalData.episodes);

    return formChanged || seasonsChanged || episodesChanged;
  };

  // Update hasChanges when data changes
  useEffect(() => {
    setHasChanges(checkForChanges());
  }, [formData, seasons, episodes, originalData]);

  // Initialize form data when series changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (series && !isNew) {
        // Editing existing series
        const initialFormData = {
          title: series.title,
          description: series.description,
          releaseYear: series.releaseYear,
          genres: series.genres,
          rating: series.rating || 0,
          cast: series.cast,
          coverUrl: series.coverUrl || '',
          backdropUrl: series.backdropUrl || '',
          isPublished: series.isPublished,
        };
        setFormData(initialFormData);
        // Fetch seasons and episodes
        fetchSeriesDetails();

        // Store original data for change tracking
        setOriginalData({
          formData: initialFormData,
          seasons: [], // Will be set after fetch
          episodes: [], // Will be set after fetch
        });
      } else {
        // Adding new series - use defaults
        const initialFormData = {
          title: '',
          description: '',
          releaseYear: new Date().getFullYear(),
          genres: [],
          rating: 0,
          cast: [],
          coverUrl: '',
          backdropUrl: '',
          isPublished: false,
        };
        setFormData(initialFormData);
        setSeasons([]);
        setEpisodes([]);

        // Store original data for change tracking
        setOriginalData({
          formData: initialFormData,
          seasons: [],
          episodes: [],
        });
      }
      setHasChanges(false);
    }
  }, [series, isNew, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof SeriesFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));

    if (errors[name as keyof SeriesFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
      setFormData((prev) => ({ ...prev, genres: [...prev.genres, genreInput.trim()] }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData((prev) => ({ ...prev, genres: prev.genres.filter((g) => g !== genre) }));
  };

  const addCastMember = () => {
    if (castInput.trim() && !formData.cast.includes(castInput.trim())) {
      setFormData((prev) => ({ ...prev, cast: [...prev.cast, castInput.trim()] }));
      setCastInput('');
    }
  };

  const removeCastMember = (castMember: string) => {
    setFormData((prev) => ({ ...prev, cast: prev.cast.filter((c) => c !== castMember) }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof SeriesFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (
      !formData.releaseYear ||
      formData.releaseYear < 1900 ||
      formData.releaseYear > new Date().getFullYear() + 1
    )
      newErrors.releaseYear = 'Release year must be valid';
    if (formData.genres.length === 0) newErrors.genres = 'At least one genre is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Generate slug from title for new series
      const seriesData = {
        ...formData,
        slug: formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      };

      // First, update/create the series
      const result = await onUpdateSeries(seriesData);

      // If we have seasons and episodes to save, and this is not a new series or we got a series ID
      if (seasons.length > 0 && series?.id) {
        try {
          // Prepare seasons data for API
          const seasonsData = seasons.map((season) => ({
            number: season.number,
            title: season.title,
            overview: season.overview,
            posterUrl: season.posterUrl,
            episodes: episodes
              .filter((ep) => ep.seasonId === season.id)
              .map((ep) => ({
                number: ep.number,
                title: ep.title,
                overview: ep.overview,
                runtime: ep.runtime,
                still_path: ep.stillUrl?.startsWith('https://image.tmdb.org/t/p/')
                  ? ep.stillUrl
                      .replace('https://image.tmdb.org/t/p/w300', '')
                      .replace('https://image.tmdb.org/t/p/w1280', '')
                      .replace('https://image.tmdb.org/t/p/original', '')
                  : ep.stillUrl,
              })),
          }));

          // Save seasons and episodes
          const seasonsResponse = await fetch(`/api/admin/series/${series.id}/seasons`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seasons: seasonsData }),
          });

          if (!seasonsResponse.ok) {
            console.warn('Failed to save seasons and episodes, but series was saved successfully');
          }
        } catch (seasonsError) {
          console.warn('Error saving seasons and episodes:', seasonsError);
          // Don't fail the whole operation if seasons save fails
        }
      }

      // Update original data to reflect saved state
      setOriginalData({
        formData: seriesData,
        seasons,
        episodes,
      });
      setHasChanges(false);

      onClose();
    } catch (error) {
      console.error('Failed to update series:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-white/10">
          <div className="flex items-center justify-between p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-netflix-red rounded-xl flex items-center justify-center">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isNew ? 'Add New Series' : 'Edit Series'}
                </h1>
                <p className="text-white/60 text-sm">
                  {isNew
                    ? 'Import from TMDB or manually add series details'
                    : 'Update series details and manage content'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex px-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'details'
                  ? 'border-netflix-red text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Series Details</span>
            </button>
            <button
              onClick={() => setActiveTab('seasons')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'seasons'
                  ? 'border-netflix-red text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Seasons & Episodes</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className={`overflow-y-auto p-8 ${hasChanges ? 'max-h-[calc(90vh-140px-100px)]' : 'max-h-[calc(90vh-140px)]'}`}
        >
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="text-white font-semibold">Series Status</h3>
                  <p className="text-white/60 text-sm">
                    Control whether this series is published and visible to users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
                    }
                    className="sr-only peer"
                    aria-label="Series published status"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                </label>
              </div>

              {/* TMDB Search Section */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-netflix-red rounded-lg flex items-center justify-center">
                    <Tv className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Import from TMDB</h3>
                    <p className="text-white/60 text-sm">
                      Search and import series data from The Movie Database
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search for a TV series..."
                      value={tmdbSearchQuery}
                      onChange={(e) => setTmdbSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                    />
                    {tmdbSearching && (
                      <Loader className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-netflix-red" />
                    )}
                  </div>

                  {/* Search Results */}
                  {showTmdbResults && tmdbSearchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="max-h-64 overflow-y-auto space-y-2"
                    >
                      {tmdbSearchResults.map((series) => (
                        <motion.div
                          key={series.tmdbId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-4 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors cursor-pointer"
                          onClick={() => populateFromTMDB(series)}
                        >
                          {series.coverUrl && (
                            <Image
                              width={480}
                              height={270}
                              src={series.coverUrl}
                              alt={series.title}
                              className="w-12 h-18 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{series.title}</h4>
                            <p className="text-white/60 text-sm">{series.releaseYear}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-white/60 text-xs">{series.rating}/10</span>
                            </div>
                          </div>
                          <Download className="w-5 h-5 text-netflix-red" />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {showTmdbResults && tmdbSearchResults.length === 0 && !tmdbSearching && (
                    <div className="text-center py-8 text-white/60">
                      No series found. Try a different search term.
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  Series Title <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <Tv className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                      errors.title ? 'border-netflix-red' : 'border-white/20'
                    } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40`}
                    placeholder="Enter series title"
                  />
                </div>
                {errors.title && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  Description <span className="text-netflix-red">*</span>
                </label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 w-5 h-5 text-white/40" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                      errors.description ? 'border-netflix-red' : 'border-white/20'
                    } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40 resize-none`}
                    placeholder="Enter series description"
                  />
                </div>
                {errors.description && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.description}</span>
                  </div>
                )}
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Release Year */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">
                    Release Year <span className="text-netflix-red">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      name="releaseYear"
                      value={formData.releaseYear}
                      onChange={handleNumberChange}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className={`w-full pl-12 pr-4 py-4 bg-black/40 border ${
                        errors.releaseYear ? 'border-netflix-red' : 'border-white/20'
                      } text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all`}
                    />
                  </div>
                  {errors.releaseYear && (
                    <div className="flex items-center space-x-2 text-netflix-red text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.releaseYear}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Rating (0-10)</label>
                  <div className="relative">
                    <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all"
                      placeholder="8.5"
                    />
                  </div>
                </div>
              </div>

              {/* Genre Tags */}
              <div className="space-y-4">
                <label className="block text-white font-semibold">
                  Genres <span className="text-netflix-red">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Add genre (e.g., Drama, Comedy)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={addGenre}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-netflix-red hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </motion.button>
                </div>

                {errors.genres && (
                  <div className="flex items-center space-x-2 text-netflix-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.genres}</span>
                  </div>
                )}

                {formData.genres && formData.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.genres.map((genre, index) => (
                      <motion.span
                        key={genre}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center space-x-2 group hover:border-netflix-red/50 transition-colors"
                      >
                        <span>{genre}</span>
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="text-white/60 hover:text-netflix-red ml-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cast Members */}
              <div className="space-y-4">
                <label className="block text-white font-semibold">Cast Members</label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={castInput}
                      onChange={(e) => setCastInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Add cast member"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCastMember())}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={addCastMember}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white py-4 px-6 rounded-xl font-semibold transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </motion.button>
                </div>

                {formData.cast && formData.cast.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.cast.map((castMember, index) => (
                      <motion.span
                        key={castMember}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/10 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center space-x-2 group hover:border-netflix-red/50 transition-colors"
                      >
                        <span>{castMember}</span>
                        <button
                          type="button"
                          onClick={() => removeCastMember(castMember)}
                          className="text-white/60 hover:text-netflix-red ml-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Media URLs */}
              <div className="grid grid-cols-1 gap-6">
                {/* Cover URL */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Cover URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="coverUrl"
                      value={formData.coverUrl}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Enter cover image URL"
                    />
                  </div>
                  {formData.coverUrl && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <Image
                        width={200}
                        height={300}
                        src={formData.coverUrl}
                        alt="Cover preview"
                        className="h-32 object-contain mx-auto rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Backdrop URL */}
                <div className="space-y-2">
                  <label className="block text-white font-semibold">Backdrop URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="backdropUrl"
                      value={formData.backdropUrl}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/20 text-white rounded-xl focus:border-netflix-red focus:outline-none transition-all placeholder-white/40"
                      placeholder="Enter backdrop image URL"
                    />
                  </div>
                  {formData.backdropUrl && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <Image
                        width={400}
                        height={200}
                        src={formData.backdropUrl}
                        alt="Backdrop preview"
                        className="h-32 w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions - Only show when there are changes */}
              {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 z-10">
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center space-x-2 px-6 py-3 text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="bg-netflix-red hover:bg-red-700 disabled:bg-white/20 disabled:text-white/40 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-netflix-red/25"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>{isNew ? 'Adding Series...' : 'Updating Series...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>{isNew ? 'Add Series' : 'Update Series'}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* Seasons & Episodes Tab */
            <div className="space-y-6">
              {/* Seasons List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-semibold">Seasons</h3>
                  <button
                    onClick={() => {
                      // Add new season logic
                      const newSeasonNumber = seasons.length + 1;
                      const newSeason: SeasonData = {
                        number: newSeasonNumber,
                        title: `Season ${newSeasonNumber}`,
                        overview: '',
                        episodes: [],
                      };
                      setSeasons([...seasons, newSeason]);
                    }}
                    className="bg-netflix-red hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Season
                  </button>
                </div>

                {seasons.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No seasons added yet. Click "Add Season" to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {seasons.map((season, index) => (
                      <div
                        key={season.id || index}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">
                            Season {season.number}: {season.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">
                              {season.episodes?.length || 0} episodes
                            </span>
                            <button
                              onClick={() => setSelectedSeason(season.id!)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                selectedSeason === season.id
                                  ? 'bg-netflix-red text-white'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {selectedSeason === season.id ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>

                        {selectedSeason === season.id && (
                          <div className="mt-4 space-y-4">
                            {/* Episodes for selected season */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="text-white/80 font-medium">Episodes</h5>
                                <button
                                  onClick={() => {
                                    // Add new episode logic
                                    const currentEpisodes = episodes.filter(
                                      (ep) => ep.seasonId === season.id
                                    );
                                    const newEpisodeNumber = currentEpisodes.length + 1;
                                    const newEpisode: EpisodeData = {
                                      number: newEpisodeNumber,
                                      title: `Episode ${newEpisodeNumber}`,
                                      overview: '',
                                      runtime: 0,
                                      seasonId: season.id,
                                    };
                                    setEpisodes([...episodes, newEpisode]);

                                    // Update season episodes
                                    const updatedSeasons = seasons.map((s) =>
                                      s.id === season.id
                                        ? { ...s, episodes: [...(s.episodes || []), newEpisode] }
                                        : s
                                    );
                                    setSeasons(updatedSeasons);
                                  }}
                                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  Add Episode
                                </button>
                              </div>

                              {episodes.filter((ep) => ep.seasonId === season.id).length === 0 ? (
                                <div className="text-center py-4 text-white/40 text-sm">
                                  No episodes added yet.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {episodes
                                    .filter((ep) => ep.seasonId === season.id)
                                    .map((episode, epIndex) => (
                                      <div
                                        key={episode.id || epIndex}
                                        className="bg-black/20 rounded p-3 space-y-3"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <span className="text-white/60 text-sm">
                                              #{episode.number}
                                            </span>
                                            <span className="text-white font-medium">
                                              {episode.title}
                                            </span>
                                            {episode.videoUrl && (
                                              <div
                                                className="w-2 h-2 bg-green-500 rounded-full"
                                                title="Video uploaded"
                                              ></div>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => {
                                                // Toggle episode details edit mode
                                                setSelectedEpisode(
                                                  selectedEpisode === episode.id
                                                    ? ''
                                                    : episode.id || `temp-${epIndex}`
                                                );
                                              }}
                                              className="text-white/60 hover:text-white px-2 py-1 rounded text-sm transition-colors"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (!series?.id) {
                                                  toast.error(
                                                    'Please save the series first before uploading videos'
                                                  );
                                                  return;
                                                }
                                                setEpisodeUploadData({
                                                  seriesId: series.id,
                                                  seasonNumber: season.number,
                                                  episodeNumber: episode.number,
                                                  seriesTitle: formData.title,
                                                  episodeTitle:
                                                    episode.title || `Episode ${episode.number}`,
                                                });
                                                setShowEpisodeUpload(true);
                                              }}
                                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                                !series?.id
                                                  ? 'bg-white/20 text-white/40 cursor-not-allowed'
                                                  : 'bg-netflix-red hover:bg-red-700 text-white'
                                              }`}
                                              disabled={!series?.id}
                                            >
                                              Upload Video
                                            </button>
                                          </div>
                                        </div>

                                        {/* Episode Details Edit */}
                                        {selectedEpisode === (episode.id || `temp-${epIndex}`) && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-t border-white/10 pt-3 space-y-3"
                                          >
                                            {/* TMDB Episode Search */}
                                            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                                              <div className="flex items-center space-x-2 mb-2">
                                                <div className="w-6 h-6 bg-netflix-red rounded flex items-center justify-center">
                                                  <Search className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-white/80 text-sm font-medium">
                                                  Import from TMDB
                                                </span>
                                              </div>
                                              <div className="space-y-2">
                                                <div className="relative">
                                                  <input
                                                    type="text"
                                                    placeholder="Search for episode..."
                                                    value={episodeSearchQuery}
                                                    onChange={(e) =>
                                                      setEpisodeSearchQuery(e.target.value)
                                                    }
                                                    className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/20 text-white rounded text-sm focus:border-netflix-red focus:outline-none placeholder-white/40"
                                                  />
                                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                                                  {episodeSearching && (
                                                    <Loader className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-netflix-red" />
                                                  )}
                                                </div>

                                                {/* Episode Search Results */}
                                                {showEpisodeSearchResults &&
                                                  episodeSearchResults.length > 0 && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: 'auto' }}
                                                      className="max-h-32 overflow-y-auto space-y-1"
                                                    >
                                                      {episodeSearchResults.map((tmdbEpisode) => (
                                                        <motion.div
                                                          key={tmdbEpisode.id}
                                                          initial={{ opacity: 0, x: -10 }}
                                                          animate={{ opacity: 1, x: 0 }}
                                                          className="flex items-center space-x-3 p-2 bg-black/20 rounded hover:bg-black/30 transition-colors cursor-pointer"
                                                          onClick={() => {
                                                            // Populate episode with TMDB data
                                                            const updatedEpisodes = episodes.map(
                                                              (ep) =>
                                                                ep.seasonId === season.id &&
                                                                ep.number === episode.number
                                                                  ? {
                                                                      ...ep,
                                                                      title: tmdbEpisode.name,
                                                                      overview:
                                                                        tmdbEpisode.overview,
                                                                      runtime: tmdbEpisode.runtime,
                                                                      stillUrl:
                                                                        tmdbEpisode.still_path
                                                                          ? `https://image.tmdb.org/t/p/w1280${tmdbEpisode.still_path}`
                                                                          : undefined,
                                                                    }
                                                                  : ep
                                                            );
                                                            setEpisodes(updatedEpisodes);
                                                            setEpisodeSearchQuery('');
                                                            setShowEpisodeSearchResults(false);
                                                          }}
                                                        >
                                                          {tmdbEpisode.still_path && (
                                                            <Image
                                                              width={92}
                                                              height={64}
                                                              src={`https://image.tmdb.org/t/p/w92${tmdbEpisode.still_path}`}
                                                              alt={tmdbEpisode.name}
                                                              className="w-12 h-8 object-cover rounded"
                                                            />
                                                          )}
                                                          <div className="flex-1">
                                                            <div className="text-white text-sm font-medium">
                                                              {tmdbEpisode.name}
                                                            </div>
                                                            <div className="text-white/60 text-xs">
                                                              Episode {tmdbEpisode.episode_number} •{' '}
                                                              {tmdbEpisode.runtime}min
                                                            </div>
                                                          </div>
                                                        </motion.div>
                                                      ))}
                                                    </motion.div>
                                                  )}

                                                {showEpisodeSearchResults &&
                                                  episodeSearchResults.length === 0 &&
                                                  !episodeSearching && (
                                                    <div className="text-center py-2 text-white/40 text-sm">
                                                      No episodes found
                                                    </div>
                                                  )}
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-white/80 text-sm mb-1">
                                                  Title
                                                </label>
                                                <input
                                                  type="text"
                                                  value={episode.title || ''}
                                                  onChange={(e) => {
                                                    const updatedEpisodes = episodes.map((ep) =>
                                                      ep.seasonId === season.id &&
                                                      ep.number === episode.number
                                                        ? { ...ep, title: e.target.value }
                                                        : ep
                                                    );
                                                    setEpisodes(updatedEpisodes);
                                                  }}
                                                  className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white rounded text-sm focus:border-netflix-red focus:outline-none"
                                                  placeholder="Episode title"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-white/80 text-sm mb-1">
                                                  Runtime (minutes)
                                                </label>
                                                <input
                                                  type="number"
                                                  value={episode.runtime || ''}
                                                  onChange={(e) => {
                                                    const updatedEpisodes = episodes.map((ep) =>
                                                      ep.seasonId === season.id &&
                                                      ep.number === episode.number
                                                        ? {
                                                            ...ep,
                                                            runtime: parseInt(e.target.value) || 0,
                                                          }
                                                        : ep
                                                    );
                                                    setEpisodes(updatedEpisodes);
                                                  }}
                                                  className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white rounded text-sm focus:border-netflix-red focus:outline-none"
                                                  placeholder="45"
                                                />
                                              </div>
                                            </div>
                                            <div>
                                              <label className="block text-white/80 text-sm mb-1">
                                                Description
                                              </label>
                                              <textarea
                                                value={episode.overview || ''}
                                                onChange={(e) => {
                                                  const updatedEpisodes = episodes.map((ep) =>
                                                    ep.seasonId === season.id &&
                                                    ep.number === episode.number
                                                      ? { ...ep, overview: e.target.value }
                                                      : ep
                                                  );
                                                  setEpisodes(updatedEpisodes);
                                                }}
                                                rows={2}
                                                className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white rounded text-sm focus:border-netflix-red focus:outline-none resize-none"
                                                placeholder="Episode description"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-white/80 text-sm mb-1">
                                                Backdrop URL
                                              </label>
                                              <input
                                                type="text"
                                                value={episode.stillUrl || ''}
                                                onChange={(e) => {
                                                  const updatedEpisodes = episodes.map((ep) =>
                                                    ep.seasonId === season.id &&
                                                    ep.number === episode.number
                                                      ? { ...ep, stillUrl: e.target.value }
                                                      : ep
                                                  );
                                                  setEpisodes(updatedEpisodes);
                                                }}
                                                className="w-full px-3 py-2 bg-black/40 border border-white/20 text-white rounded text-sm focus:border-netflix-red focus:outline-none"
                                                placeholder="https://image.tmdb.org/t/p/w1280/..."
                                              />
                                            </div>
                                          </motion.div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Episode Upload Modal */}
      <AnimatePresence>
        {showEpisodeUpload && episodeUploadData && (
          <EpisodeUpload
            seriesId={episodeUploadData.seriesId}
            seasonNumber={episodeUploadData.seasonNumber}
            episodeNumber={episodeUploadData.episodeNumber}
            seriesTitle={episodeUploadData.seriesTitle}
            episodeTitle={episodeUploadData.episodeTitle}
            onUploadComplete={async (videoUrl) => {
              try {
                // Update the episode in the database
                const response = await fetch('/api/admin/series/upload', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    seriesId: series?.id,
                    seasonNumber: episodeUploadData.seasonNumber,
                    episodeNumber: episodeUploadData.episodeNumber,
                    videoUrl,
                  }),
                });

                if (response.ok) {
                  // Update the local state
                  const updatedEpisodes = episodes.map((ep) =>
                    ep.seasonId ===
                      seasons.find((s) => s.number === episodeUploadData.seasonNumber)?.id &&
                    ep.number === episodeUploadData.episodeNumber
                      ? { ...ep, videoUrl }
                      : ep
                  );
                  setEpisodes(updatedEpisodes);
                  toast.success('Episode video uploaded successfully');
                } else {
                  toast.error('Failed to update episode video URL');
                }
              } catch (error) {
                console.error('Error updating episode video:', error);
                toast.error('Failed to update episode video URL');
              }

              setShowEpisodeUpload(false);
              setEpisodeUploadData(null);
            }}
            onClose={() => {
              setShowEpisodeUpload(false);
              setEpisodeUploadData(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
export default EditSeriesModal;
