// components/movies/movie-page-skeleton.tsx
'use client';

// Skeleton layout highly matches actual grid layout for best CLS
export default function MoviePageSkeleton() {
  return (
    <>
      {/* Page loading - header placeholder */}

      <div className="my-8">
        {/* Movie filter skeleton matches real filter bar dimensions */}
        <div className="h-12 w-full bg-white/10 rounded animate-pulse" />
      </div>

      {/* Movie grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            {/* Aspect ratio and height match movie cards */}
            <div className="aspect-[2/3] h-64 rounded-lg bg-white/10" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}
