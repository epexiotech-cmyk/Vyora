import * as React from 'react';

import { cn } from '@/lib/utils';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col justify-between border-b pb-4 sm:flex-row sm:items-center',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="mt-4 flex items-center space-x-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
