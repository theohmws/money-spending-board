import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export const Card = ({
  className,
  size = 'default',
  ...props
}: ComponentProps<'div'> & { size?: 'default' | 'sm' }) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      'flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 data-[size=sm]:gap-3 data-[size=sm]:py-3',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-header"
    className={cn(
      'grid auto-rows-min items-start gap-1 px-4 has-[[data-slot=card-action]]:grid-cols-[1fr_auto] group-data-[size=sm]/card:px-3',
      className
    )}
    {...props}
  />
);

export const CardTitle = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-title"
    className={cn('text-base font-medium leading-snug', className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    data-slot="card-description"
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);

export const CardAction = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-action"
    className={cn('col-start-2 row-span-2 row-start-1 self-start', className)}
    {...props}
  />
);

export const CardContent = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-content"
    className={cn('px-4 group-data-[size=sm]/card:px-3', className)}
    {...props}
  />
);

export const CardFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-footer"
    className={cn('flex items-center border-t bg-muted/50 p-4', className)}
    {...props}
  />
);
