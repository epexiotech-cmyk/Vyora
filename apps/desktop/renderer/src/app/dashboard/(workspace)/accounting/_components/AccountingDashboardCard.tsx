import { LucideIcon } from 'lucide-react';
import * as React from 'react';

interface AccountingDashboardCardProps {
  title?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccountingDashboardCard({
  title,
  icon: Icon,
  iconBgColor = 'bg-slate-100 dark:bg-slate-800',
  iconColor = 'text-slate-500 dark:text-slate-400',
  children,
  className = '',
}: AccountingDashboardCardProps) {
  return (
    <div className={`bg-card flex h-full flex-col rounded-xl border p-6 shadow-sm ${className}`}>
      {(title || Icon) && (
        <div className="mb-4 flex items-center gap-3">
          {Icon && (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor} ${iconColor}`}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          {title && (
            <h3 className="text-sm font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
              {title}
            </h3>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
