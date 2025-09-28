'use client';

import { useEffect, useRef } from 'react';

// Core Web Vitals and Performance Metrics
interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift

  // Additional Performance Metrics
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive

  // Custom Netflix-grade metrics
  navigationStart?: number;
  navigationEnd?: number;
  hydrationTime?: number;
  cacheHits?: number;
  cacheMisses?: number;
  imageLoadTime?: number;
  pprRegionLoadTime?: number;

  // Error tracking
  errors?: Array<{
    message: string;
    timestamp: number;
    stack?: string;
  }>;

  // User context
  userAgent?: string;
  connection?: string;
  viewport?: string;
  timestamp: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = { timestamp: Date.now() };
  private observers: Map<string, PerformanceObserver> = new Map();
  private navigationStartTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  private initializeTracking() {
    // Track navigation start
    this.navigationStartTime = performance.now();
    this.metrics.navigationStart = this.navigationStartTime;

    // Initialize Core Web Vitals tracking
    this.trackCoreWebVitals();

    // Track custom Netflix-grade metrics
    this.trackCustomMetrics();

    // Track cache performance
    this.trackCachePerformance();

    // Track image loading performance
    this.trackImagePerformance();

    // Track errors
    this.trackErrors();

    // Track user context
    this.trackUserContext();
  }

  private trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
        this.metrics.LCP = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming & { processingStart: number };
          const fid = fidEntry.processingStart - fidEntry.startTime;
          this.metrics.FID = fid;
          this.reportMetric('FID', fid);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value: number;
          };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        });
        this.metrics.CLS = clsValue;
        this.reportMetric('CLS', clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        // CLS not supported
      }
    }
  }

  private trackCustomMetrics() {
    // Track Navigation Timing
    if ('performance' in window && 'navigation' in performance) {
      const navTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navTiming) {
        this.metrics.TTFB = navTiming.responseStart - navTiming.requestStart;
        this.metrics.FCP = navTiming.loadEventEnd - navTiming.fetchStart;
        this.reportMetric('TTFB', this.metrics.TTFB);
        this.reportMetric('FCP', this.metrics.FCP);
      }
    }

    // Track hydration time
    const hydrationStart = performance.now();
    if (typeof window !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.hydrationTime = performance.now() - hydrationStart;
        this.reportMetric('hydrationTime', this.metrics.hydrationTime);
      });
    }
  }

  private trackCachePerformance() {
    // Override fetch to track cache hits/misses
    const originalFetch = window.fetch;
    let cacheHits = 0;
    let cacheMisses = 0;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Check if response came from cache
      if (
        response.headers.get('cf-cache-status') === 'HIT' ||
        response.headers.get('x-cache') === 'HIT'
      ) {
        cacheHits++;
      } else {
        cacheMisses++;
      }

      this.metrics.cacheHits = cacheHits;
      this.metrics.cacheMisses = cacheMisses;

      return response;
    };
  }

  private trackImagePerformance() {
    if ('PerformanceObserver' in window) {
      const imgObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        let totalImageLoadTime = 0;
        let imageCount = 0;

        entries.forEach((entry) => {
          if (
            entry.name.includes('image') ||
            entry.name.includes('.jpg') ||
            entry.name.includes('.png') ||
            entry.name.includes('.webp')
          ) {
            totalImageLoadTime += entry.duration;
            imageCount++;
          }
        });

        if (imageCount > 0) {
          this.metrics.imageLoadTime = totalImageLoadTime / imageCount;
          this.reportMetric('avgImageLoadTime', this.metrics.imageLoadTime);
        }
      });

      try {
        imgObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('image', imgObserver);
      } catch (e) {
        // Resource timing not supported
      }
    }
  }

  private trackErrors() {
    window.addEventListener('error', (event) => {
      if (!this.metrics.errors) this.metrics.errors = [];

      this.metrics.errors.push({
        message: event.message,
        timestamp: Date.now(),
        stack: event.error?.stack,
      });

      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (!this.metrics.errors) this.metrics.errors = [];

      this.metrics.errors.push({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now(),
      });

      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now(),
      });
    });
  }

  private trackUserContext() {
    this.metrics.userAgent = navigator.userAgent;
    this.metrics.viewport = `${window.innerWidth}x${window.innerHeight}`;

    // Track connection info if available
    if ('connection' in navigator) {
      const conn = (
        navigator as Navigator & {
          connection?: { effectiveType?: string };
        }
      ).connection;
      this.metrics.connection = conn?.effectiveType || 'unknown';
    }
  }

  // Track PPR region loading
  trackPPRRegion(regionName: string, loadTime: number) {
    this.metrics.pprRegionLoadTime = loadTime;
    this.reportMetric(`pprRegion_${regionName}`, loadTime);
  }

  // Track navigation end
  trackNavigationEnd() {
    this.metrics.navigationEnd = performance.now();
    const totalNavigationTime = this.metrics.navigationEnd - this.navigationStartTime;
    this.reportMetric('totalNavigationTime', totalNavigationTime);
  }

  public reportMetric(name: string, value: number) {
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics 4
      if ('gtag' in window) {
        const gtag = (
          window as Window & {
            gtag?: (command: string, eventName: string, parameters: object) => void;
          }
        ).gtag;
        gtag?.('event', 'performance_metric', {
          metric_name: name,
          metric_value: value,
          custom_parameter: this.metrics.connection,
        });
      }

      // Example: Custom analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value: value,
          timestamp: Date.now(),
          userAgent: this.metrics.userAgent,
          viewport: this.metrics.viewport,
          connection: this.metrics.connection,
        }),
      }).catch(() => {
        // Silent fail for analytics
      });
    } else {
      // Development logging
      console.log(`🚀 Performance Metric: ${name} = ${value}ms`, {
        connection: this.metrics.connection,
        viewport: this.metrics.viewport,
      });
    }
  }

  private reportError(error: { message: string; stack?: string; timestamp: number }) {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (e.g., Sentry)
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silent fail
      });
    } else {
      console.error('🔥 Performance Error:', error);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance tracker instance
let performanceTracker: PerformanceTracker | null = null;

export function getPerformanceTracker(): PerformanceTracker {
  if (!performanceTracker && typeof window !== 'undefined') {
    performanceTracker = new PerformanceTracker();
  }
  return performanceTracker!;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const tracker = useRef<PerformanceTracker | null>(null);

  useEffect(() => {
    tracker.current = getPerformanceTracker();

    return () => {
      tracker.current?.disconnect();
    };
  }, []);

  const trackCustomMetric = (name: string, value: number) => {
    tracker.current?.reportMetric(name, value);
  };

  const trackPPRRegion = (regionName: string, loadTime: number) => {
    tracker.current?.trackPPRRegion(regionName, loadTime);
  };

  const trackNavigationEnd = () => {
    tracker.current?.trackNavigationEnd();
  };

  const getMetrics = () => {
    return tracker.current?.getMetrics() || { timestamp: Date.now() };
  };

  return {
    trackCustomMetric,
    trackPPRRegion,
    trackNavigationEnd,
    getMetrics,
  };
}

// Performance monitoring component
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  const { trackNavigationEnd } = usePerformanceMonitor();

  useEffect(() => {
    // Track when navigation is complete
    const timer = setTimeout(() => {
      trackNavigationEnd();
    }, 100);

    return () => clearTimeout(timer);
  }, [trackNavigationEnd]);

  return <>{children}</>;
}

// Performance monitoring HOC
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { trackCustomMetric } = usePerformanceMonitor();
    const renderStart = useRef<number>(0);

    useEffect(() => {
      renderStart.current = performance.now();
    }, []);

    useEffect(() => {
      const renderTime = performance.now() - renderStart.current;
      trackCustomMetric(`component_render_${componentName}`, renderTime);
    });

    return <Component {...props} />;
  };
}
