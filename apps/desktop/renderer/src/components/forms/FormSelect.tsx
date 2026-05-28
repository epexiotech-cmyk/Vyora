import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  options: { label: string; value: string | number }[];
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, name, options, ...props }, _ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const hasError = !!errors[name];

    return (
      <select
        className={cn(
          'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        id={name}
        {...register(name)}
        {...props}
      >
        <option value="" disabled hidden>
          Select an option
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);
FormSelect.displayName = 'FormSelect';
