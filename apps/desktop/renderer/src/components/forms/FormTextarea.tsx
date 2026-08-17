import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (props, ref) => {
    const { className, name, ...rest } = props;
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const hasError = !!errors[name];

    const registration = register(name);

    return (
      <textarea
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        id={name}
        {...registration}
        {...rest}
        ref={(element) => {
          registration.ref(element);

          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
        }}
      />
    );
  },
);
FormTextarea.displayName = 'FormTextarea';
