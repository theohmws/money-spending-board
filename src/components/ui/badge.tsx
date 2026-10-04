import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export const badgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:pointer-events-none [&>svg]:!size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive:
          'bg-destructive/10 text-destructive dark:bg-destructive/20',
        outline: 'border-border text-foreground',
        ghost: 'text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const Badge = ({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) => (
  <span
    data-slot="badge"
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
);
