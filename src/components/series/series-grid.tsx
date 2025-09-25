'use client';

import { SeriesCard } from './series-card';
import { useSeries } from './series-context';

export function SeriesGrid() {
  const { filteredSeries } = useSeries();

  if (filteredSeries.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-white mb-2">No series found</h3>
        <p className="text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {filteredSeries.map((series, index) => (
        <SeriesCard
          key={series.id}
          series={series}
          index={index}
          priority={index < 6} // Prioritize loading first 6 images
        />
      ))}
    </div>
  );
}
