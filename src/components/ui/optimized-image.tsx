'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  preloadOnHover?: boolean;
  blurDataURL?: string;
  style?: React.CSSProperties;
}

// Generate a simple blur placeholder
function generateBlurDataURL(color = '#141414'): string {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${color}" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  placeholder = 'blur',
  quality = 85,
  loading,
  sizes,
  onLoad,
  onError,
  fallbackSrc = '/placeholder-movie.jpg',
  preloadOnHover = true,
  blurDataURL,
  style,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const preloadRef = useRef<HTMLImageElement | null>(null);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = () => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false); // Reset error state to try fallback
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  };

  // Preload on hover for instant loading on click
  const handleMouseEnter = () => {
    setIsHovered(true);

    if (preloadOnHover && !priority && !preloadRef.current) {
      preloadRef.current = new window.Image();
      preloadRef.current.src = imageSrc;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Generate responsive sizes if not provided
  const responsiveSizes =
    sizes || (fill ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw');

  // Use the passed quality or default
  const dynamicQuality = quality;

  // Clean up preload ref on unmount
  useEffect(() => {
    return () => {
      if (preloadRef.current) {
        preloadRef.current = null;
      }
    };
  }, []);

  const imageProps = {
    ref: imageRef,
    src: imageSrc,
    alt,
    quality: dynamicQuality,
    onLoad: handleLoad,
    onError: handleError,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    loading: priority ? 'eager' : loading || 'lazy',
    className: cn(
      'transition-all duration-300',
      isLoading && 'animate-pulse bg-netflix-dark-gray',
      isHovered && 'transform scale-105',
      hasError && 'bg-netflix-medium-gray',
      className
    ),
    style: {
      ...style,
      ...(isLoading && { backgroundColor: '#141414' }),
    },
    sizes: responsiveSizes,
    priority,
    placeholder: placeholder,
    blurDataURL: blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined),
  };

  // Error state
  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-netflix-medium-gray text-netflix-text-gray',
          className
        )}
        style={style}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  // Render the optimized image
  if (fill) {
    return <Image {...imageProps} fill />;
  }

  return <Image {...imageProps} width={width} height={height} />;
}

// Specialized poster image component
export function PosterImage({
  src,
  alt,
  priority = false,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={cn('object-cover', className)}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
      quality={priority ? 90 : 75}
      {...props}
    />
  );
}

// Specialized backdrop image component
export function BackdropImage({
  src,
  alt,
  priority = false,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={cn('object-cover', className)}
      sizes="100vw"
      quality={priority ? 95 : 80}
      {...props}
    />
  );
}

// Avatar image with fallback
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  fallback,
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'> & {
  size?: number;
  fallback?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError && fallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-netflix-red text-white font-semibold rounded-full',
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      onError={() => setHasError(true)}
      quality={80}
      sizes={`${size}px`}
      {...props}
    />
  );
}
