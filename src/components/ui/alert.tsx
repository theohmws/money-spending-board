import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

const alertVariants = cva(
  'grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const Alert = ({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) => (
  <div
    role="alert"
    data-slot="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
);
