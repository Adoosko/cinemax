import * as React from 'react';
import { cn } from '@/lib/utils';

// Main Card wrapper
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Netflix-style colors, shadow, border
        'bg-netflix-medium-gray text-white flex flex-col gap-5 rounded-2xl border border-netflix-light-gray shadow-lg py-6 transition-all duration-200',
        className
      )}
      {...props}
    />
  );
}

// Card Header: bold top section
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('px-6 pb-4 border-b border-netflix-light-gray grid gap-2', className)}
      {...props}
    />
  );
}

// Card Title: large, cinematic headline
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('font-bold text-lg leading-tight text-netflix-white', className)}
      {...props}
    />
  );
}

// Card Description: muted, info
function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-netflix-text-gray text-sm mt-1', className)}
      {...props}
    />
  );
}

// Card Content: padded well for movie info, media, controls
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6 py-3', className)} {...props} />;
}

// Card Actions: align to end/side, for controls
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('self-end justify-self-end col-start-2 row-span-2', className)}
      {...props}
    />
  );
}

// Card Footer: bottom border, action list
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center px-6 pt-4 border-t border-netflix-light-gray mt-auto',
        className
      )}
      {...props}
    />
  );
}

// Export as shadcn/ui card set
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
