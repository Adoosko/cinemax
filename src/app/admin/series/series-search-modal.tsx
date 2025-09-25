'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface SeriesSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSeries: (seriesData: any) => void;
}

interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
}

export function SeriesSearchModal({ isOpen, onClose, onAddSeries }: SeriesSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBSeries[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      // This would typically call your backend API that interfaces with TMDB
      // For now, we'll simulate a direct call to TMDB
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&type=tv`
      );
      const data = await response.json();

      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching TMDB:', error);
      toast.error('Failed to search for series');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddSeries = async (tmdbSeries: TMDBSeries) => {
    try {
      // Fetch detailed series info from TMDB
      const response = await fetch(`/api/tmdb/tv/${tmdbSeries.id}`);
      const seriesDetails = await response.json();

      if (!seriesDetails) {
        throw new Error('Failed to fetch series details');
      }

      // Transform TMDB data to our format
      const seriesData = {
        title: tmdbSeries.name,
        slug: tmdbSeries.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: tmdbSeries.overview,
        releaseYear: new Date(tmdbSeries.first_air_date).getFullYear(),
        coverUrl: tmdbSeries.poster_path
          ? `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}`
          : null,
        backdropUrl: tmdbSeries.backdrop_path
          ? `https://image.tmdb.org/t/p/original${tmdbSeries.backdrop_path}`
          : null,
        rating: tmdbSeries.vote_average,
        genres: seriesDetails.genres?.map((genre: any) => genre.name) || [],
        cast: seriesDetails.credits?.cast?.slice(0, 10).map((actor: any) => actor.name) || [],
        tmdbId: tmdbSeries.id,
        isPublished: false,
        // Add seasons and episodes data
        seasonsData:
          seriesDetails.seasons?.map((season: any) => ({
            number: season.season_number,
            title: season.name,
            overview: season.overview,
            episodeCount: season.episode_count,
            airDate: season.air_date,
            posterUrl: season.poster_path
              ? `https://image.tmdb.org/t/p/w300${season.poster_path}`
              : null,
          })) || [],
      };

      onAddSeries(seriesData);
      onClose();
    } catch (error) {
      console.error('Error adding series:', error);
      toast.error('Failed to add series');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search for TV Series</DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 my-4">
          <Input
            placeholder="Search for a TV series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {searchResults.map((series) => (
              <div
                key={series.id}
                className="flex border rounded-lg overflow-hidden hover:bg-gray-50 cursor-pointer"
                onClick={() => handleAddSeries(series)}
              >
                <div className="w-24 h-36 relative flex-shrink-0">
                  {series.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${series.poster_path}`}
                      alt={series.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1">
                  <h3 className="font-medium">{series.name}</h3>
                  <p className="text-sm text-gray-500">
                    {series.first_air_date
                      ? new Date(series.first_air_date).getFullYear()
                      : 'Unknown year'}
                  </p>
                  <p className="text-sm line-clamp-3 mt-1">{series.overview}</p>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
