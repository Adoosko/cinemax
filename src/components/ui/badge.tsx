import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1.5 transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-netflix-red text-white',
        secondary: 'bg-white/10 text-white border border-white/20 ',
        destructive: 'bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30',
        outline: 'border border-white/20 text-white hover:bg-white/10',
        premium:
          'bg-gradient-to-r from-netflix-red to-netflix-dark-red text-white shadow-md hover:shadow-glow',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
