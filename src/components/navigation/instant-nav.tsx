'use client';

import { preloadMovie, warmMovieCache } from '@/lib/hooks/use-movies-swr';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface InstantNavProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  preloadData?: boolean;
  animationType?: 'fade' | 'slide' | 'scale';
  onNavigationStart?: () => void;
  onNavigationComplete?: () => void;
}

// Netflix-style page transition variants
const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.05, opacity: 0 },
  },
};

export function InstantNav({
  href,
  children,
  className = '',
  preloadData = true,
  animationType = 'fade',
  onNavigationStart,
  onNavigationComplete,
}: InstantNavProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverStartTimeRef = useRef<number | null>(null);

  // Preload data on hover for instant loading
  const handleMouseEnter = useCallback(() => {
    hoverStartTimeRef.current = Date.now();

    if (preloadData) {
      // Delay preloading slightly to avoid excessive requests
      preloadTimeoutRef.current = setTimeout(() => {
        // Extract movie slug from href if it's a movie page
        const movieMatch = href.match(/\/movies\/([^\/]+)/);
        if (movieMatch) {
          preloadMovie(movieMatch[1]);
        }

        // Preload the page using Next.js router prefetch
        router.prefetch(href);
      }, 100);
    }
  }, [href, preloadData, router]);

  // Clear preload timeout on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
  }, []);

  // Handle instant navigation
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const hoverDuration = hoverStartTimeRef.current ? Date.now() - hoverStartTimeRef.current : 0;

      // If user hovered for less than 200ms, add a small delay for better UX
      const navigationDelay = hoverDuration < 200 ? 50 : 0;

      setIsNavigating(true);
      onNavigationStart?.();

      setTimeout(() => {
        router.push(href);

        // Reset navigation state after transition
        setTimeout(() => {
          setIsNavigating(false);
          onNavigationComplete?.();
        }, 200);
      }, navigationDelay);
    },
    [href, router, onNavigationStart, onNavigationComplete]
  );

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  const transition = pageTransitions[animationType];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-full text-left transition-netflix gpu-accelerated
          ${isNavigating ? 'pointer-events-none' : ''}
          ${className}
        `}
        disabled={isNavigating}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isNavigating ? 'navigating' : 'idle'}
            variants={transition}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Navigation loading overlay */}
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}

// Hook for managing page transitions
export function useInstantNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setNavigationProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setNavigationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 50);

    return progressInterval;
  }, []);

  const completeNavigation = useCallback(() => {
    setNavigationProgress(100);
    setTimeout(() => {
      setIsNavigating(false);
      setNavigationProgress(0);
    }, 200);
  }, []);

  return {
    isNavigating,
    navigationProgress,
    startNavigation,
    completeNavigation,
  };
}

// Global navigation progress bar
export function NavigationProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleRouteStart = () => {
      setIsVisible(true);
      setProgress(10);
    };

    const handleRouteComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    };

    // Listen to route changes (this would need to be connected to your router events)
    // For now, we'll just provide the component structure

    return () => {
      // Clean up event listeners
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/20"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-netflix-red to-netflix-dark-red shadow-glow"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

// Higher-order component for wrapping pages with transitions
export function withPageTransition<P extends object>(
  Component: React.ComponentType<P>,
  animationType: 'fade' | 'slide' | 'scale' = 'fade'
) {
  return function PageWithTransition(props: P) {
    const transition = pageTransitions[animationType];

    return (
      <motion.div
        variants={transition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <Component {...props} />
      </motion.div>
    );
  };
}

// Cache warming on app initialization
export function CacheWarmer() {
  useEffect(() => {
    // Warm up critical caches after initial load
    const timer = setTimeout(() => {
      warmMovieCache();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
