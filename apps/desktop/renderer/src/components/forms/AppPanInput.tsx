import { validatePanPartial } from '@vyora/utils';
import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { FormInputProps } from './FormInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AppPanInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, name, ...props }, ref) => {
    const {
      control,
      setError,
      clearErrors,
      formState: { errors },
    } = useFormContext();
    const { field } = useController({ name, control });
    const hasError = !!errors[name];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase();
      field.onChange(val);

      if (val) {
        const res = validatePanPartial(val);
        if (!res.valid) {
          setError(name, { type: 'manual', message: res.error || 'Invalid format' });
        } else {
          clearErrors(name);
        }
      } else {
        clearErrors(name);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      field.onBlur();
      const val = e.target.value;
      if (val) {
        const res = validatePanPartial(val);
        if (res.valid && !res.isComplete) {
          setError(name, { type: 'manual', message: '10 characters are needed in PAN format' });
        }
      }
    };

    return (
      <input
        {...props}
        name={field.name}
        value={field.value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        ref={ref || field.ref}
        maxLength={10}
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm uppercase shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
      />
    );
  },
);
AppPanInput.displayName = 'AppPanInput';
