import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useCurrency } from '../providers/CompanyContextProvider';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

export const MoneyInput = ({ name, className, ...props }: MoneyInputProps) => {
  const { register } = useFormContext();
  const currency = useCurrency();
  const isPrefix = currency.symbolPosition === 'PREFIX';

  return (
    <div className="relative flex w-full items-center">
      {isPrefix && (
        <span className="text-muted-foreground pointer-events-none absolute left-3 text-sm">
          {currency.symbol}
        </span>
      )}
      <input
        {...register(name, { valueAsNumber: true })}
        type="number"
        step={1 / Math.pow(10, currency.decimalPlaces)}
        className={`border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${isPrefix ? 'pr-3 pl-8' : 'pr-8 pl-3'} ${className || ''}`}
        {...props}
      />
      {!isPrefix && (
        <span className="text-muted-foreground pointer-events-none absolute right-3 text-sm">
          {currency.symbol}
        </span>
      )}
    </div>
  );
};
