'use client';

import {
  AttendanceAggregationResult,
  DailyAttendanceResult,
  MarkAttendanceInput,
} from '@vyora/types';
import { AlertCircle, Edit2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { AttendanceKpiCards } from '../../../attendance/register/_components/AttendanceKpiCards';

import { AppModal, ColumnDef, DataTable } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function EmployeeAttendance({ employeeId }: { employeeId: string }) {
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
  const [isAggregateLoading, setIsAggregateLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Manual mark state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<DailyAttendanceResult | null>(null);
  const [markStatus, setMarkStatus] = React.useState<'Present' | 'Absent' | 'Half Day'>('Present');
  const [markRemarks, setMarkRemarks] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
            setError(res.error || 'Failed to load attendance');
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

    const timer = setTimeout(() => {
      fetchAggregate();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [employeeId, fromDate, toDate]);

  const refreshAggregate = async () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    try {
      setIsAggregateLoading(true);
      const res = await window.vyora.db.attendance.aggregate({
        employeeId,
        fromDate: start,
        toDate: end,
      });
      if (res.success && res.data) {
        setAggregateResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAggregateLoading(false);
    }
  };

  const handleMark = async () => {
    if (!selectedDate || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload: MarkAttendanceInput = {
        employeeId,
        attendanceDate: selectedDate,
        status: markStatus,
        remarks: markRemarks || undefined,
      };

      const res = await window.vyora.db.attendance.mark(payload);
      if (res.success) {
        toast.success('Attendance marked successfully');
        setIsModalOpen(false);
        await refreshAggregate();
      } else {
        toast.error(res.error || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!selectedDate || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.attendance.clear({
        employeeId,
        attendanceDate: selectedDate,
      });
      if (res.success) {
        toast.success('Manual attendance cleared successfully');
        setIsModalOpen(false);
        await refreshAggregate();
      } else {
        toast.error(res.error || 'Failed to clear attendance');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDate(new Date(row.date));
            setSelectedRecord(row);
            setMarkStatus('Present');
            setMarkRemarks('');
            setIsModalOpen(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </AppButton>
      ),
    },
  ];

  return (
    <AppCard className="col-span-1 p-6 shadow-sm md:col-span-2">
      <div className="mb-4 flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-medium">Attendance</h3>
          <p className="text-muted-foreground text-sm">
            View and manage attendance for this employee.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">From:</label>
            <input
              type="date"
              className="border-input flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">To:</label>
            <input
              type="date"
              className="border-input flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isAggregateLoading && !aggregateResult && (
          <div className="text-muted-foreground p-8 text-center">Loading attendance...</div>
        )}

        {aggregateResult && (
          <>
            <AttendanceKpiCards data={aggregateResult} />
            <div className="mt-4 overflow-hidden rounded-md border">
              <DataTable
                columns={columns}
                data={aggregateResult.dailyDetails}
                isLoading={isAggregateLoading}
                keyExtractor={(item) => new Date(item.date).getTime().toString()}
                emptyMessage="No attendance data found for this period."
              />
            </div>
          </>
        )}
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={`Mark Attendance - ${selectedDate ? selectedDate.toLocaleDateString() : ''}`}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
              value={markStatus}
              onChange={(e) => setMarkStatus(e.target.value as 'Present' | 'Absent' | 'Half Day')}
              disabled={isSubmitting}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Remarks (Optional)</label>
            <input
              type="text"
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
              value={markRemarks}
              onChange={(e) => setMarkRemarks(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Overridden by admin"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div>
            {selectedRecord?.isManualOverride && (
              <AppButton
                type="button"
                variant="destructive"
                onClick={handleClear}
                disabled={isSubmitting}
              >
                Clear Manual Record
              </AppButton>
            )}
          </div>
          <div className="flex gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton type="button" onClick={handleMark} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </AppCard>
  );
}
