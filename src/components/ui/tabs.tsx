'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/utils/cn';

export const Tabs = ({ className, ...props }: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    className={cn('group/tabs flex flex-col gap-2', className)}
    {...props}
  />
);

export const TabsList = ({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & { variant?: 'default' | 'line' }) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    data-variant={variant}
    className={cn(
      'group/tabs-list inline-flex h-8 w-full items-center justify-center text-muted-foreground',
      variant === 'default'
        ? 'rounded-lg bg-muted p-[3px]'
        : 'gap-1 bg-transparent',
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  ...props
}: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    className={cn(
      'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[0.5rem] border border-transparent px-1.5 py-0.5 text-sm font-medium text-foreground/60 outline-none transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm dark:data-[active]:border-input dark:data-[active]:bg-input/30',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: TabsPrimitive.Panel.Props) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn('flex-1 text-sm outline-none', className)}
    {...props}
  />
);
