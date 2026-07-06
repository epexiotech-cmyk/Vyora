import React from 'react';

interface AmountCellProps {
  amount: number;
  type?: 'Dr' | 'Cr';
  className?: string;
  hideType?: boolean;
}

export function AmountCell({ amount, type, className = '', hideType = false }: AmountCellProps) {
  if (amount === 0 || amount == null)
    return <span className={`text-muted-foreground ${className}`}>-</span>;

  const formattedAmount = (amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {formattedAmount}
      {!hideType && type ? ` ${type}` : ''}
    </span>
  );
}
