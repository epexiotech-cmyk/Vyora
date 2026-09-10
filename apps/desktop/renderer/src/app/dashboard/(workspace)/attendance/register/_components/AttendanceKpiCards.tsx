import { AttendanceAggregationResult } from '@vyora/types';
import * as React from 'react';

import { AppCard } from '@/components/ui/AppCard';

interface AttendanceKpiCardsProps {
  data: AttendanceAggregationResult;
}

export function AttendanceKpiCards({ data }: AttendanceKpiCardsProps) {
  const kpis = [
    { label: 'Total Calendar Days', value: data.totalCalendarDays },
    { label: 'Payable Days', value: data.payableDays, valueClass: 'text-primary' },
    { label: 'Present', value: data.presentDays, valueClass: 'text-success' },
    { label: 'Absent', value: data.absentDays, valueClass: 'text-destructive' },
    { label: 'Half Days', value: data.halfDays, valueClass: 'text-warning' },
    { label: 'Paid Leaves', value: data.paidLeaves },
    { label: 'Unpaid Leaves', value: data.unpaidLeaves },
    { label: 'Weekly Offs', value: data.weeklyOffs },
    { label: 'Holidays', value: data.holidays },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
      {kpis.map((kpi, idx) => (
        <AppCard key={idx} className="flex flex-col p-4">
          <span className="text-muted-foreground text-xs font-medium">{kpi.label}</span>
          <span className={`mt-1 text-xl font-bold ${kpi.valueClass || ''}`}>{kpi.value}</span>
        </AppCard>
      ))}
    </div>
  );
}
