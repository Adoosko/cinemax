import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/50 focus-visible:ring-offset-1 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30',
        primary:
          'bg-netflix-red text-white shadow-md hover:bg-netflix-dark-red focus-visible:ring-netflix-red/50',
        destructive:
          'bg-destructive text-white shadow-md hover:bg-destructive/90 focus-visible:ring-destructive/50',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/30',
        secondary: 'bg-netflix-medium-gray text-white shadow-xs hover:bg-netflix-light-gray',
        ghost: 'text-white hover:bg-white/10 hover:text-white',
        link: 'text-netflix-red underline-offset-4 hover:underline hover:text-netflix-dark-red',
        glass:
          'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
        premium:
          'bg-gradient-to-r from-netflix-red to-netflix-dark-red text-white shadow-md hover:shadow-glow',
      },
      size: {
        default: 'h-10 px-4 py-2 rounded-lg',
        sm: 'h-8 rounded-lg gap-1.5 px-3 text-xs',
        md: 'h-10 rounded-lg px-5 py-2.5',
        lg: 'h-12 rounded-xl px-6 py-3 text-base',
        xl: 'h-14 rounded-xl px-8 py-4 text-lg font-semibold',
        icon: 'h-10 w-10 rounded-full p-2',
        'icon-sm': 'h-8 w-8 rounded-full p-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Define the props for the regular button
type RegularButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    withAnimation?: boolean;
  };

// Define the props for the motion button
type MotionButtonProps = Omit<
  HTMLMotionProps<'button'>,
  keyof VariantProps<typeof buttonVariants>
> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    withAnimation?: boolean;
  };

// Union type that can be either regular or motion button props
type ButtonProps = RegularButtonProps;

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  withAnimation = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const buttonClasses = cn(buttonVariants({ variant, size, className }));

  // If loading, show loading state
  const content = isLoading ? (
    <>
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
      {loadingText || props.children}
    </>
  ) : (
    props.children
  );

  // If animation is enabled, wrap with motion component
  if (withAnimation) {
    // We need to cast props to any to avoid TypeScript errors with event handlers
    // This is because React's event handlers and Framer Motion's event handlers have different signatures
    const buttonProps = props as any;

    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
        data-slot="button"
        className={buttonClasses}
        disabled={isLoading || buttonProps.disabled}
        {...buttonProps}
      >
        {content}
      </motion.button>
    );
  }

  // Otherwise, render normal button
  return (
    <Comp
      data-slot="button"
      className={buttonClasses}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };

// Animation variants for button animations
export const buttonAnimationVariants = {
  hover: {
    scale: 1.03,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
  initial: {
    scale: 1,
  },
};
