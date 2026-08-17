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

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>((props, ref) => {
  const { className, name, ...rest } = props;
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const hasError = !!errors[name];

  const registration = register(name);

  return (
    <input
      type="checkbox"
      className={cn(
        'border-primary ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        hasError && 'border-destructive',
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
FormCheckbox.displayName = 'FormCheckbox';
