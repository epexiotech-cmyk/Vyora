import * as React from 'react';

import { AppInput } from '@/components/ui/AppInput';
import { cn } from '@/lib/utils';

export interface AppDatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function AppDatePicker({
  label,
  value,
  onChange,
  error,
  disabled,
  className,
}: AppDatePickerProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label className={cn('text-sm leading-none font-medium', error && 'text-destructive')}>
          {label}
        </label>
      )}
      <AppInput
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
      />
      {error && <p className="text-destructive text-[0.8rem] font-medium">{error}</p>}
    </div>
  );
}
