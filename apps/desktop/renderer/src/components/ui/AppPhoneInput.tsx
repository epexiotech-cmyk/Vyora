import React from 'react';
import PhoneInput from 'react-phone-number-input';

import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface AppPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  onBlur?: () => void;
}

export function AppPhoneInput({
  value,
  onChange,
  className,
  disabled = false,
  required = false,
  placeholder = 'Enter phone number',
  id,
  onBlur,
}: AppPhoneInputProps) {
  return (
    <div
      className={cn(
        'border-input bg-background ring-offset-background focus-within:ring-ring flex w-full items-center rounded-md border text-sm focus-within:ring-2 focus-within:ring-offset-2',
        className,
      )}
    >
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={(val: string | undefined) => onChange(val || '')}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        id={id}
        onBlur={onBlur}
        className="flex w-full"
        style={
          {
            '--PhoneInput-color--focus': 'transparent',
            '--PhoneInputCountrySelectArrow-opacity': '0.5',
            '--PhoneInputCountrySelectArrow-width': '0.3em',
            '--PhoneInputCountrySelectArrow-marginLeft': '0.3em',
            '--PhoneInputCountryFlag-height': '1em',
          } as React.CSSProperties
        }
        numberInputProps={{
          className:
            'flex h-10 w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        }}
        countrySelectProps={{
          className: 'bg-transparent border-0 outline-none p-2 ml-2 cursor-pointer',
        }}
      />
    </div>
  );
}
