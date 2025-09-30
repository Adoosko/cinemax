'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useSeriesContinueWatching } from '@/lib/hooks/use-series-continue-watching';
import { useMemo } from 'react';
import { SeriesCard } from './series-card';
import { Series } from './series-context';

interface SeriesRecommendationsProps {
  allSeries?: Series[];
  currentSeriesId?: string;
}

export default function SeriesRecommendations({
  allSeries = [],
  currentSeriesId,
}: SeriesRecommendationsProps) {
  const { continueWatching: seriesContinueWatching } = useSeriesContinueWatching();

  // Filter and shuffle recommendations
  const recommendedSeries = useMemo(() => {
    if (!allSeries || allSeries.length === 0) return [];
    const watchingSeriesIds = new Set(seriesContinueWatching.map((item: any) => item.seriesId));
    const filtered = allSeries.filter(
      (series) =>
        (!currentSeriesId || series.id !== currentSeriesId) && !watchingSeriesIds.has(series.id)
    );
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [allSeries, currentSeriesId, seriesContinueWatching]);

  if (recommendedSeries.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        More Shows to Binge (You Will Thank Us)
      </h2>
      <Carousel opts={{ align: 'start', loop: true }} className="w-full">
        <CarouselContent className="-ml-4">
          {recommendedSeries.map((series, index) => (
            <CarouselItem key={series.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <SeriesCard series={series} index={index} priority={index < 4} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-black/50 text-white border-none hover:bg-black/80" />
        <CarouselNext className="right-2 bg-black/50 text-white border-none hover:bg-black/80" />
      </Carousel>
    </div>
  );
}
