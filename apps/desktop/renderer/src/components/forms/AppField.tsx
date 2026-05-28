import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppFieldProps {
  name: string;
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AppField({ name, label, description, children, className }: AppFieldProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-muted-foreground text-[0.8rem]">{description}</p>
      )}
      {error && <p className="text-destructive text-[0.8rem] font-medium">{error}</p>}
    </div>
  );
}
