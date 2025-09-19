'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'neon' | 'dark' | 'rainbow';
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}

export function AnimatedGradient({
  className,
  variant = 'primary',
  speed = 'normal',
  direction = 'diagonal',
  children,
  ...props
}: AnimatedGradientProps) {
  const speedValues = {
    slow: 20,
    normal: 10,
    fast: 5,
  };

  const gradients = {
    primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600',
    neon: 'bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-600',
    dark: 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900',
    rainbow:
      'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
  };

  return (
    <div className="relative overflow-hidden" {...props}>
      <motion.div
        className={cn('absolute inset-0 opacity-80', gradients[variant])}
        style={{
          backgroundSize:
            direction === 'horizontal'
              ? '200% 100%'
              : direction === 'vertical'
                ? '100% 200%'
                : '200% 200%',
        }}
        animate={{
          backgroundPosition:
            direction === 'horizontal'
              ? ['0% 50%', '100% 50%']
              : direction === 'vertical'
                ? ['50% 0%', '50% 100%']
                : ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: speedValues[speed],
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />

      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  );
}
