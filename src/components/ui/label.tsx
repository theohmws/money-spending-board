import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export const Label = ({ className, ...props }: ComponentProps<'label'>) => (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  <label
    data-slot="label"
    className={cn(
      'flex select-none items-center gap-2 text-sm font-medium leading-none',
      className
    )}
    {...props}
  />
);
