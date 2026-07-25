import { validatePhonePartial } from '@vyora/utils';
import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

import { AppPhoneInput } from '../ui/AppPhoneInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppFormPhoneInputProps extends Omit<
  React.ComponentProps<typeof AppPhoneInput>,
  'value' | 'onChange' | 'id'
> {
  name: string;
}

export function AppFormPhoneInput({ className, name, ...props }: AppFormPhoneInputProps) {
  const {
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const { field } = useController({ name, control });
  const hasError = !!errors[name];

  const handleChange = (val: string) => {
    field.onChange(val);

    if (val) {
      const res = validatePhonePartial(val);
      if (!res.valid) {
        setError(name, { type: 'manual', message: res.error || 'Invalid format' });
      } else {
        clearErrors(name);
      }
    } else {
      clearErrors(name);
    }
  };

  const handleBlur = () => {
    field.onBlur();
    const val = field.value;
    if (val) {
      const res = validatePhonePartial(val);
      if (res.valid && !res.isComplete) {
        setError(name, { type: 'manual', message: 'Incomplete phone number format' });
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <AppPhoneInput
        {...props}
        id={name}
        value={field.value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        className={hasError ? 'border-destructive focus-within:ring-destructive' : ''}
      />
    </div>
  );
}
