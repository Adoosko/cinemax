'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  imageLoadTime: number;
  apiResponseTime: number;
}

interface PerformanceTrackerProps {
  pageName: string;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceTracker({ pageName, onMetrics }: PerformanceTrackerProps) {
  const startTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    // Track page load performance
    startTimeRef.current = performance.now();
    renderStartRef.current = performance.now();

    const trackMetrics = () => {
      const loadTime = performance.now() - startTimeRef.current;
      const renderTime = performance.now() - renderStartRef.current;

      // Track Core Web Vitals
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');

      const metrics: PerformanceMetrics = {
        loadTime,
        renderTime,
        imageLoadTime: 0, // Will be updated by image load events
        apiResponseTime: navigation?.responseEnd - navigation?.requestStart || 0,
      };

      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚀 Performance Metrics - ${pageName}`);
        console.log(`Load Time: ${loadTime.toFixed(2)}ms`);
        console.log(`Render Time: ${renderTime.toFixed(2)}ms`);
        console.log(`API Response: ${metrics.apiResponseTime.toFixed(2)}ms`);
        if (fcp) {
          console.log(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
        }
        console.groupEnd();
      }

      onMetrics?.(metrics);

      // Send to analytics in production (example)
      if (process.env.NODE_ENV === 'production') {
        // You could send this to your analytics service
        // analytics.track('page_performance', { page: pageName, ...metrics });
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(trackMetrics);
    } else {
      setTimeout(trackMetrics, 0);
    }

    // Track image loading performance
    const trackImageLoad = (event: Event) => {
      const img = event.target as HTMLImageElement;
      const loadTime = performance.now() - startTimeRef.current;

      if (process.env.NODE_ENV === 'development') {
        console.log(`📸 Image loaded: ${img.src} (${loadTime.toFixed(2)}ms)`);
      }
    };

    // Listen for image load events
    document.addEventListener('load', trackImageLoad, true);

    return () => {
      document.removeEventListener('load', trackImageLoad, true);
    };
  }, [pageName, onMetrics]);

  return null; // This component doesn't render anything
}

// Hook to measure component render time
export function useRenderTime(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  });
}

// Hook to measure API call performance
export function useApiPerformance() {
  const measureApiCall = async (
    apiCall: () => Promise<unknown>,
    endpoint: string
  ): Promise<unknown> => {
    const startTime = performance.now();

    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API Call ${endpoint}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Call ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      }

      throw error;
    }
  };

  return { measureApiCall };
}

// Performance budget warnings
export function checkPerformanceBudget(metrics: PerformanceMetrics) {
  const budgets = {
    loadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    apiResponseTime: 1000, // 1 second
    imageLoadTime: 2000, // 2 seconds
  };

  const warnings: string[] = [];

  Object.entries(budgets).forEach(([metric, budget]) => {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (value > budget) {
      warnings.push(`${metric} (${value.toFixed(2)}ms) exceeds budget (${budget}ms)`);
    }
  });

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Performance Budget Exceeded:', warnings);
  }

  return warnings;
}
