import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full bg-white/10 text-white placeholder:text-white/40 px-4 py-3 rounded-xl border border-white/20',
        'focus:border-netflix-red focus:outline-none focus:bg-white/20 transition-all',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-red-500',
        className
      )}
      {...props}
    />
  );
}

export { Input };
