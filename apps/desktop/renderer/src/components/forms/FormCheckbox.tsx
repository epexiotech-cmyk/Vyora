import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ className, name, ...props }) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const hasError = !!errors[name];

    return (
      <input
        type="checkbox"
        className={cn(
          'border-primary ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive',
          className,
        )}
        id={name}
        {...register(name)}
        {...props}
      />
    );
  },
);
FormCheckbox.displayName = 'FormCheckbox';
