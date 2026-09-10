'use client';

import { AttendanceAggregationResult, EmployeeDto, DailyAttendanceResult } from '@vyora/types';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { AttendanceKpiCards } from './AttendanceKpiCards';

import { ColumnDef, DataTable } from '@/components/shared';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function AttendanceRegisterDashboard() {
  const [employees, setEmployees] = React.useState<EmployeeDto[]>([]);
  const [employeeId, setEmployeeId] = React.useState<string>('');
  const [fromDate, setFromDate] = React.useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const offset = firstDay.getTimezoneOffset();
    const local = new Date(firstDay.getTime() - offset * 60 * 1000);
    return local.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = React.useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const offset = lastDay.getTimezoneOffset();
    const local = new Date(lastDay.getTime() - offset * 60 * 1000);
    return local.toISOString().split('T')[0];
  });

  const [aggregateResult, setAggregateResult] = React.useState<AttendanceAggregationResult | null>(
    null,
  );

  const [isEmployeesLoading, setIsEmployeesLoading] = React.useState(true);
  const [isAggregateLoading, setIsAggregateLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        setIsEmployeesLoading(true);
        const res = await window.vyora.db.employees.search({ limit: 1000 });
        if (mounted && res.success && res.data) {
          const empData = res.data as unknown as { data?: EmployeeDto[]; items?: EmployeeDto[] };
          setEmployees(empData.data || empData.items || []);
        } else if (mounted && !res.success) {
          toast.error(res.error || 'Failed to load employees');
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          toast.error('Error loading employees');
        }
      } finally {
        if (mounted) {
          setIsEmployeesLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function fetchAggregate() {
      if (!employeeId || !fromDate || !toDate) {
        if (mounted) setAggregateResult(null);
        return;
      }

      const start = new Date(fromDate);
      const end = new Date(toDate);

      if (start > end) {
        if (mounted) setError('From Date cannot be after To Date');
        return;
      }

      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const totalCalendarDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

      if (totalCalendarDays > 366) {
        if (mounted) setError('Cannot view more than 366 days at a time');
        return;
      }

      try {
        if (mounted) {
          setIsAggregateLoading(true);
          setError(null);
        }

        const res = await window.vyora.db.attendance.aggregate({
          employeeId,
          fromDate: start,
          toDate: end,
        });

        if (mounted) {
          if (res.success && res.data) {
            setAggregateResult(res.data);
          } else {
            setError(res.error || 'Failed to load attendance register');
            setAggregateResult(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setError('An unexpected error occurred');
          setAggregateResult(null);
        }
      } finally {
        if (mounted) {
          setIsAggregateLoading(false);
        }
      }
    }

    // Small debounce to prevent multiple calls if user is typing date
    const timer = setTimeout(() => {
      fetchAggregate();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [employeeId, fromDate, toDate]);

  const columns: ColumnDef<DailyAttendanceResult>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'day',
      header: 'Day',
      cell: (row) => new Date(row.date).toLocaleDateString(undefined, { weekday: 'short' }),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        if (!row.included) {
          return <span className="text-muted-foreground italic">Excluded</span>;
        }
        let variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' = 'default';
        if (row.status === 'Present') variant = 'success';
        if (row.status === 'Absent') variant = 'destructive';
        if (row.status === 'Half Day') variant = 'warning';
        if (row.status === 'Leave') variant = 'secondary';

        return (
          <div className="flex items-center gap-2">
            <StatusBadge variant={variant}>{row.status || 'N/A'}</StatusBadge>
            {row.isManualOverride && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                Manual
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'dayValue',
      header: 'Day Value',
      cell: (row) => (row.included ? row.dayValue : '-'),
    },
    {
      key: 'payableValue',
      header: 'Payable',
      cell: (row) => (row.included ? row.payableValue : '-'),
    },
    {
      key: 'leaveValue',
      header: 'Leave Info',
      cell: (row) => {
        if (!row.included) return '-';
        if (row.paidLeaveValue > 0)
          return <span className="text-success">{row.paidLeaveValue} Paid Leave</span>;
        if (row.unpaidLeaveValue > 0)
          return <span className="text-destructive">{row.unpaidLeaveValue} Unpaid Leave</span>;
        return '-';
      },
    },
  ];

  const selectedEmployeeName = React.useMemo(() => {
    if (!employeeId) return '';
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : '';
  }, [employeeId, employees]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Global Attendance Register"
        description="View aggregated attendance statistics and daily register for an employee."
      />

      <AppCard className="flex flex-col gap-4 p-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Employee</label>
          <select
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={isEmployeesLoading}
          >
            <option value="" disabled hidden>
              Select an employee...
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">From Date</label>
          <input
            type="date"
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">To Date</label>
          <input
            type="date"
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </AppCard>

      {error && (
        <div className="bg-destructive/15 text-destructive flex items-center gap-2 rounded-md p-4">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!employeeId ? (
        <AppCard className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground text-lg">Select an employee to view attendance.</p>
        </AppCard>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selectedEmployeeName}&apos;s Attendance</h2>
          </div>

          {aggregateResult && <AttendanceKpiCards data={aggregateResult} />}

          <AppCard className="p-6">
            <DataTable
              columns={columns}
              data={aggregateResult?.dailyDetails || []}
              isLoading={isAggregateLoading}
              keyExtractor={(item) => new Date(item.date).getTime().toString()}
              emptyMessage={
                isAggregateLoading
                  ? 'Loading register...'
                  : 'No attendance data found for this range.'
              }
            />
          </AppCard>
        </>
      )}
    </div>
  );
}
