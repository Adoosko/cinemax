'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamic import for the video player with loading state
const VideoPlayerComponent = dynamic(
  () => import('@/components/video/video-player').then((mod) => ({ default: mod.VideoPlayer })),
  {
    loading: () => (
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading player...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Type the dynamically imported component
export const DynamicVideoPlayer = VideoPlayerComponent as ComponentType<any>;
