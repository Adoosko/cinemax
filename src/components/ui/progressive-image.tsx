'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality,
  sizes,
  blurDataURL,
  placeholder = 'blur',
  fetchPriority,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile-aware quality: lower quality on mobile to reduce bandwidth
  const imageQuality = quality !== undefined ? quality : isMobile ? 60 : 75;

  // Generate a simple blur placeholder if none provided
  const defaultBlurDataURL =
    blurDataURL ||
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  // Fallback image for errors
  const fallbackSrc = '/placeholder-movie.jpg';

  if (hasError) {
    return (
      <div className={`bg-neutral-800 flex items-center justify-center ${className}`}>
        <div className="text-neutral-500 text-center">
          <div className="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        priority={priority}
        quality={imageQuality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        fetchPriority={fetchPriority}
        {...props}
      />

      {/* Loading state - only show if not loaded and no error */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
