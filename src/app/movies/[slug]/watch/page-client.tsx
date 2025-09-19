'use client';

import { useEffect } from 'react';

interface ViewingStatsProps {
  movieTitle: string;
}

export function ViewingStatsInitializer({ movieTitle }: ViewingStatsProps) {
  useEffect(() => {
    // Initialize viewing stats from localStorage
    const savedProgress = localStorage.getItem(`movie-progress-${movieTitle}`);
    const savedLastWatched = localStorage.getItem(`movie-last-watched-${movieTitle}`);

    if (savedProgress) {
      const progressBar = document.getElementById('movie-progress-bar');
      const progressText = document.getElementById('movie-progress-text');

      if (progressBar) {
        progressBar.style.width = `${savedProgress}%`;
      }

      if (progressText) {
        progressText.textContent = `${savedProgress}%`;
      }
    }

    if (savedLastWatched) {
      const lastWatchedText = document.getElementById('movie-last-watched');
      if (lastWatchedText) {
        const date = new Date(savedLastWatched);
        lastWatchedText.textContent = date.toLocaleString();
      }
    }
  }, [movieTitle]);

  return null; // This component doesn't render anything
}
