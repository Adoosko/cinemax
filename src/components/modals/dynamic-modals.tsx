'use client';

import dynamic from 'next/dynamic';

// Dynamic imports for modal components to reduce initial bundle size
export const DynamicTrailerModal = dynamic(
  () => import('@/components/movies/trailer-modal').then((mod) => ({ default: mod.TrailerModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

export const DynamicUpgradeModal = dynamic(
  () => import('@/components/modals/upgrade-modal').then((mod) => ({ default: mod.UpgradeModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

export const DynamicEditMovieModal = dynamic(() => import('@/components/admin/edit-movie-modal'), {
  loading: () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="w-12 h-12 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});

export const DynamicVideoUpload = dynamic(
  () => import('@/components/admin/video-upload').then((mod) => ({ default: mod.VideoUpload })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  }
);
