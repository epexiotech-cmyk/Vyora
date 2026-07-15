import { CurrencyMeta } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import React from 'react';

interface AmountCellProps {
  amount: number;
  currency: CurrencyMeta;
  type?: 'Dr' | 'Cr';
  className?: string;
  hideType?: boolean;
}

export function AmountCell({
  amount,
  currency,
  type,
  className = '',
  hideType = false,
}: AmountCellProps) {
  if (amount === 0 || amount == null)
    return <span className={`text-muted-foreground ${className}`}>-</span>;

  const formattedAmount = formatMoney(amount, currency);

  return (
    <span className={`tabular-nums ${className}`}>
      {formattedAmount}
      {!hideType && type ? ` ${type}` : ''}
    </span>
  );
}
