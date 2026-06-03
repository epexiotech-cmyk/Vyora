import * as React from 'react';

import { cn } from '@/lib/utils';

const AppCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'text-card-foreground rounded-md',
        'bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)]',
        'border border-[var(--card-border-light)] dark:border-[var(--card-border-dark)]',
        'shadow-[var(--card-shadow-light)] dark:shadow-[var(--card-shadow-dark)]',
        className,
      )}
      {...props}
    />
  ),
);
AppCard.displayName = 'AppCard';

const AppCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-border/50 flex flex-col space-y-1.5 border-b p-4', className)}
      {...props}
    />
  ),
);
AppCardHeader.displayName = 'AppCardHeader';

const AppCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-foreground leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
AppCardTitle.displayName = 'AppCardTitle';

const AppCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-4', className)} {...props} />
  ),
);
AppCardContent.displayName = 'AppCardContent';

export { AppCard, AppCardHeader, AppCardTitle, AppCardContent };
