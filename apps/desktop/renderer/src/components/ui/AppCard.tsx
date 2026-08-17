import * as React from 'react';

import { cn } from '@/lib/utils';

const AppCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        className={cn(
          'text-card-foreground rounded-md',
          'bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)]',
          'border border-[var(--card-border-light)] dark:border-[var(--card-border-dark)]',
          'shadow-[var(--card-shadow-light)] dark:shadow-[var(--card-shadow-dark)]',
          className,
        )}
        {...rest}
      />
    );
  },
);
AppCard.displayName = 'AppCard';

const AppCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        className={cn('border-border/50 flex flex-col space-y-1.5 border-b p-4', className)}
        {...rest}
      />
    );
  },
);
AppCardHeader.displayName = 'AppCardHeader';

const AppCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <h3
      ref={ref}
      className={cn('text-foreground leading-none font-semibold tracking-tight', className)}
      {...rest}
    />
  );
});
AppCardTitle.displayName = 'AppCardTitle';

const AppCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;
    return <div ref={ref} className={cn('p-4 pt-4', className)} {...rest} />;
  },
);
AppCardContent.displayName = 'AppCardContent';

export { AppCard, AppCardHeader, AppCardTitle, AppCardContent };
