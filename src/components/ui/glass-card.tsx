import React from 'react';
import { cn } from '@/lib/utils';

interface NetflixCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'featured' | 'hover';
  shadow?: boolean;
}

export function NetflixCard({
  className,
  variant = 'default',
  shadow = true,
  children,
  ...props
}: NetflixCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg transition-all duration-300',

        // Shadow
        shadow && 'shadow-xl shadow-black/50',

        // Variant styles
        {
          // Default Netflix card
          'bg-netflix-card border border-netflix-medium-gray/30': variant === 'default',

          // Featured content with red accent
          'bg-netflix-card border border-netflix-red/20': variant === 'featured',

          // Hover effect card
          'bg-netflix-card border border-netflix-medium-gray/30 hover:border-netflix-light-gray/50 hover:scale-105':
            variant === 'hover',
        },

        className
      )}
      style={{
        background:
          variant === 'default'
            ? '#2f2f2f'
            : variant === 'featured'
              ? 'linear-gradient(135deg, #2f2f2f 0%, #1a1a1a 100%)'
              : '#2f2f2f',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// For backward compatibility
export const GlassCard = NetflixCard;
