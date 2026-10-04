import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

const field =
  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40';

export const Input = ({
  className,
  type,
  ...props
}: ComponentProps<'input'>) => (
  <input
    type={type}
    data-slot="input"
    className={cn(field, 'h-8 py-1', className)}
    {...props}
  />
);

export const Textarea = ({
  className,
  ...props
}: ComponentProps<'textarea'>) => (
  <textarea
    data-slot="textarea"
    className={cn(field, 'min-h-16 py-2', className)}
    {...props}
  />
);

// Styled native <select>: keeps the 32px Tinysoy trigger look while staying
// accessible and mobile-friendly for the board's long category lists.
export const NativeSelect = ({
  className,
  ...props
}: ComponentProps<'select'>) => (
  <select
    data-slot="native-select"
    className={cn(field, 'h-8 py-1 text-sm', className)}
    {...props}
  />
);
