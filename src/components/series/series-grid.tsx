'use client';

import { SeriesCard } from './series-card';
import { useSeries } from './series-context';

export function SeriesGrid() {
  const { series, searchQuery, selectedGenre, isLoading } = useSeries();

  // Client-side filtering since series context doesn't handle complex filtering
  const filteredSeries = series.filter((seriesItem) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = seriesItem.title.toLowerCase().includes(searchLower);
      const genreMatch = seriesItem.genre.toLowerCase().includes(searchLower);
      const descMatch = seriesItem.description?.toLowerCase().includes(searchLower);

      if (!titleMatch && !genreMatch && !descMatch) {
        return false;
      }
    }

    // Genre filter
    if (selectedGenre && selectedGenre !== 'all') {
      const genreMatch = seriesItem.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      if (!genreMatch) {
        return false;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading series...</p>
      </div>
    );
  }

  if (filteredSeries.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-white mb-2">No series found</h3>
        <p className="text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
      {filteredSeries.map((seriesItem, index) => (
        <SeriesCard
          key={seriesItem.id}
          series={seriesItem}
          index={index}
          priority={index < 8} // Increased for aggressive optimization - covers 2 rows on mobile
        />
      ))}
    </div>
  );
}
