'use client';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  valueClassName?: string;
  variant?: 'default' | 'premium' | 'minimal';
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 3,
  className,
  showValue = true,
  valueClassName,
  variant = 'default',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          background: 'bg-black/80 backdrop-blur-md border-2 ',
          progress: 'text-netflix-red',
          shadow: 'shadow-xl shadow-black/50',
        };
      case 'minimal':
        return {
          background: 'bg-black/30 backdrop-blur-sm',
          progress: 'text-netflix-red',
          shadow: 'shadow-sm',
        };
      default:
        return {
          background: 'bg-black/70 backdrop-blur-sm',
          progress: 'text-netflix-red',
          shadow: 'shadow-md',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        styles.background,
        styles.shadow,
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
        {/* Background circle with subtle gradient */}
        <defs>
          <linearGradient id={`bg-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <linearGradient id={`progress-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E50914" />
            <stop offset="50%" stopColor="#F40612" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#bg-${variant})`}
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-60"
        />

        {/* Progress circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#progress-${variant})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out drop-shadow-sm"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(229, 9, 20, 0.3))',
          }}
        />
      </svg>

      {showValue && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow-lg',
            variant === 'premium' ? 'text-sm' : variant === 'minimal' ? 'text-xs' : 'text-xs',
            valueClassName
          )}
        >
          {Math.round(value)}%
        </div>
      )}

      {/* Subtle inner glow effect for premium variant */}
      {variant === 'premium' && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-netflix-red/5 to-transparent animate-pulse" />
      )}
    </div>
  );
}
