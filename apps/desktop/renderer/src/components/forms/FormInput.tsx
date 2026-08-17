import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const { className, type, name, ...rest } = props;
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const hasError = !!errors[name];

  const registration = register(name);

  return (
    <input
      type={type}
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
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
});
FormInput.displayName = 'FormInput';
