import React from 'react';
import { cn } from '@/lib/utils';

interface NetflixBgProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'gradient';
}

export function NetflixBg({ className, variant = 'solid', children, ...props }: NetflixBgProps) {
  return (
    <div
      className={cn(
        variant === 'solid'
          ? 'bg-netflix-black'
          : 'bg-gradient-to-b from-netflix-black via-netflix-dark-gray to-netflix-black',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
