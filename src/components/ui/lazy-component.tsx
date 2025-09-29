'use client';

import { ComponentType, lazy, ReactNode, Suspense } from 'react';

interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyComponent({
  fallback = (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  children,
}: LazyComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Higher-order component to make any component lazy-loaded
export function withLazyLoading<T extends {}>(Component: ComponentType<T>, fallback?: ReactNode) {
  const LazyLoadedComponent = lazy(() => Promise.resolve({ default: Component }));

  return function WrappedComponent(props: T) {
    return (
      <LazyComponent fallback={fallback}>
        <LazyLoadedComponent {...props} />
      </LazyComponent>
    );
  };
}
