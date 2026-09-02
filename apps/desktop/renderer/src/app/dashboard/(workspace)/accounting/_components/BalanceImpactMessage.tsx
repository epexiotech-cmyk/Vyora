import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface BalanceImpactMessageProps {
  amount?: number;
  balanceType?: 'Dr' | 'Cr';
  className?: string;
}

export function BalanceImpactMessage({
  amount = 0,
  balanceType,
  className,
}: BalanceImpactMessageProps) {
  const isNeutral = !amount || amount <= 0 || !balanceType;
  const isPositive = balanceType === 'Dr' && amount > 0;
  const isNegative = balanceType === 'Cr' && amount > 0;

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);

  if (isNeutral) {
    return (
      <div
        className={cn(
          'bg-muted/50 border-border flex items-start gap-3 rounded-md border p-3 text-sm',
          className,
        )}
      >
        <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-muted-foreground flex-1">
          <p>Please enter an amount and select a balance type to see the expected impact.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 text-sm',
        isPositive ? 'border-emerald-200 bg-emerald-50/50' : 'border-orange-200 bg-orange-50/50',
        className,
      )}
    >
      {isPositive ? (
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
      )}
      <div className="flex-1 space-y-1">
        <p className={isPositive ? 'text-emerald-800' : 'text-orange-800'}>
          This will {isPositive ? 'increase' : 'decrease'} the payment account balance by{' '}
          <span className="font-medium">{formattedAmount}</span>.
        </p>
        <p
          className={cn('text-xs font-medium', isPositive ? 'text-emerald-700' : 'text-orange-700')}
        >
          Expected impact: {isPositive ? '+' : '−'}
          {formattedAmount}
        </p>
      </div>
    </div>
  );
}
