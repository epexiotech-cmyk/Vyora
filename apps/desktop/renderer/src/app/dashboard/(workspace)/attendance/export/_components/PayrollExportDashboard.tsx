'use client';

import { PayrollExportRecord, ExportFormat } from '@vyora/types';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { AppDatePicker } from '@/components/shared';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function PayrollExportDashboard() {
  const getStartOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };
  const getEndOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  };

  const [fromDate, setFromDate] = useState<Date>(getStartOfMonth());
  const [toDate, setToDate] = useState<Date>(getEndOfMonth());
  const [records, setRecords] = useState<PayrollExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select a valid date range');
      return;
    }
    if (fromDate > toDate) {
      toast.error('From Date cannot be after To Date');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecords([]);

    try {
      const result = await window.vyora.db.payrollExport.generate({
        fromDate,
        toDate,
      });
      if (result.success) {
        setRecords(result.data?.records || []);
        if (result.data?.errors && result.data.errors.length > 0) {
          toast.warning(`Export generated with ${result.data.errors.length} errors`);
        } else {
          toast.success('Payroll export generated successfully');
        }
      } else {
        throw new Error(result.error || 'Failed to generate export');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!records.length) return;
    setIsExporting(true);
    try {
      // In a real app we would map this properly or send it directly.
      // Here we map to a flat structure for exportFile if JSON or CSV.
      const flatRecords = records.map((r) => ({
        'Employee Code': r.employeeCode,
        'Employee Name': r.employeeName,
        'From Date': r.fromDate.toISOString().split('T')[0],
        'To Date': r.toDate.toISOString().split('T')[0],
        'Total Days': r.totalCalendarDays,
        'Included Days': r.includedDays,
        Present: r.presentDays,
        Absent: r.absentDays,
        'Half Days': r.halfDays,
        'Weekly Offs': r.weeklyOffs,
        Holidays: r.holidays,
        'Paid Leave': r.paidLeaves,
        'Unpaid Leave': r.unpaidLeaves,
        'Payable Days': r.payableDays,
      }));

      const result = await window.vyora.export.exportFile({
        requestId: crypto.randomUUID(),
        source: 'data',
        format,
        data: flatRecords,
        fileName: `Payroll_Export_${fromDate.toISOString().split('T')[0]}_to_${toDate.toISOString().split('T')[0]}`,
        title: 'Payroll Attendance Export',
        columns: [
          { key: 'Employee Code', header: 'Employee Code' },
          { key: 'Employee Name', header: 'Employee Name' },
          { key: 'From Date', header: 'From Date' },
          { key: 'To Date', header: 'To Date' },
          { key: 'Total Days', header: 'Total Days' },
          { key: 'Included Days', header: 'Included Days' },
          { key: 'Present', header: 'Present' },
          { key: 'Absent', header: 'Absent' },
          { key: 'Half Days', header: 'Half Days' },
          { key: 'Weekly Offs', header: 'Weekly Offs' },
          { key: 'Holidays', header: 'Holidays' },
          { key: 'Paid Leave', header: 'Paid Leave' },
          { key: 'Unpaid Leave', header: 'Unpaid Leave' },
          { key: 'Payable Days', header: 'Payable Days' },
        ],
      });

      if (result.success) {
        toast.success(`Exported successfully to ${result.filePath}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<PayrollExportRecord>[]>(() => {
    return [
      {
        key: 'employeeCode',
        header: 'Code',
        cell: (item) => item.employeeCode,
      },
      {
        key: 'employeeName',
        header: 'Name',
        cell: (item) => item.employeeName,
      },
      {
        key: 'totalCalendarDays',
        header: 'Total',
        cell: (item) => item.totalCalendarDays,
      },
      {
        key: 'includedDays',
        header: 'Inc',
        cell: (item) => item.includedDays,
      },
      {
        key: 'presentDays',
        header: 'P',
        cell: (item) => item.presentDays,
      },
      {
        key: 'absentDays',
        header: 'A',
        cell: (item) => item.absentDays,
      },
      {
        key: 'halfDays',
        header: 'HD',
        cell: (item) => item.halfDays,
      },
      {
        key: 'weeklyOffs',
        header: 'WO',
        cell: (item) => item.weeklyOffs,
      },
      {
        key: 'holidays',
        header: 'Hol',
        cell: (item) => item.holidays,
      },
      {
        key: 'paidLeaves',
        header: 'PL',
        cell: (item) => item.paidLeaves,
      },
      {
        key: 'unpaidLeaves',
        header: 'UL',
        cell: (item) => item.unpaidLeaves,
      },
      {
        key: 'payableDays',
        header: 'Payable',
        cell: (item) => <span className="text-primary font-semibold">{item.payableDays}</span>,
      },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Payroll Export"
        description="Generate attendance and leave totals for payroll processing."
        actions={
          <AppExportDropdown
            onExport={handleExport}
            isExporting={isExporting}
            disabled={records.length === 0 || isLoading}
          />
        }
      />

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Generate Report</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-foreground text-sm font-medium">From Date</label>
              <AppDatePicker
                value={fromDate.toISOString().split('T')[0]}
                onChange={(v) => {
                  if (v) setFromDate(new Date(v));
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-foreground text-sm font-medium">To Date</label>
              <AppDatePicker
                value={toDate.toISOString().split('T')[0]}
                onChange={(v) => {
                  if (v) setToDate(new Date(v));
                }}
              />
            </div>
            <div className="flex-none">
              <AppButton onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Generate
              </AppButton>
            </div>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive mt-4 flex items-center gap-2 rounded-md p-3 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardContent className="p-0">
          <DataTable data={records} columns={columns} keyExtractor={(item) => item.employeeId} />
        </AppCardContent>
      </AppCard>
    </div>
  );
}
