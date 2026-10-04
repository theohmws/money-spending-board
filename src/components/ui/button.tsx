'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

export const buttonVariants = cva(
  "group/button active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding text-sm font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'dark:bg-input/30 dark:hover:bg-input/50 border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:border-input',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary',
        ghost: 'hover:bg-muted hover:text-foreground aria-expanded:bg-muted',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5',
        icon: 'size-8',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-md',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export const Button = ({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
);
