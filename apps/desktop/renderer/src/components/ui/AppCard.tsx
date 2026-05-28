import * as React from 'react';

import { cn } from '@/lib/utils';

const AppCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground bg-glass-bg border-glass-border rounded-md border shadow-sm backdrop-blur-md',
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
