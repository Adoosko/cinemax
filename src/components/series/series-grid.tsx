'use client';

import { SeriesCard } from './series-card';
import { useSeries } from './series-context';

export default function SeriesGrid() {
  const { series, searchQuery, selectedGenre, isLoading } = useSeries();

  // Client-side filtering for extra flexibility
  const filteredSeries = series.filter((serie) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !serie.title.toLowerCase().includes(searchLower) &&
        !serie.genre.toLowerCase().includes(searchLower) &&
        !(serie.description && serie.description.toLowerCase().includes(searchLower))
      ) {
        return false;
      }
    }
    if (selectedGenre && selectedGenre !== 'all') {
      return serie.genre.toLowerCase().includes(selectedGenre.toLowerCase());
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
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">All Series</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {filteredSeries.map((serie, index) => (
          <SeriesCard
            key={serie.id}
            series={serie}
            index={index}
            priority={index < 8} // Top 8 for LCP optimization
          />
        ))}
      </div>
    </div>
  );
}
