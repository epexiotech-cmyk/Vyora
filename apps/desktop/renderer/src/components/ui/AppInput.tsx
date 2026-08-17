import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const AppInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className, type, ...rest } = props;
  return (
    <input
      type={type}
      className={cn(
        'border-input bg-background/50 placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...rest}
    />
  );
});
AppInput.displayName = 'AppInput';

export { AppInput };
