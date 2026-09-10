'use client';

import {
  LeaveRequestDto,
  LeaveTypeDto,
  FinancialYearDto,
  CreateLeaveRequestInput,
} from '@vyora/types';
import { Calendar, Edit, FileText, CheckCircle, XCircle, XSquare } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { LeaveRequestForm } from './LeaveRequestForm';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface EmployeeLeaveRequestsProps {
  employeeId: string;
}

export function EmployeeLeaveRequests({ employeeId }: EmployeeLeaveRequestsProps) {
  const [requests, setRequests] = React.useState<LeaveRequestDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeDto[]>([]);
  const [financialYears, setFinancialYears] = React.useState<FinancialYearDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      await Promise.resolve();
      setIsLoading(true);
      const [reqRes, ltRes, fyRes] = await Promise.all([
        window.vyora.db.leaveRequests.search({ employeeId, limit: 100 }),
        window.vyora.db.leaveTypes.getAll(),
        window.vyora.financialYear.list(),
      ]);
      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data.items);
      }
      if (ltRes.success && ltRes.data) {
        setLeaveTypes(ltRes.data);
      }
      if (fyRes.success && fyRes.data) {
        setFinancialYears(fyRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave requests');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleCreate = async (data: CreateLeaveRequestInput) => {
    try {
      const res = await window.vyora.db.leaveRequests.create(data);
      if (res.success) {
        toast.success('Leave request created');
        setIsFormOpen(false);
        loadData();
        // Fire custom event to refresh balances component
        window.dispatchEvent(new Event('vyora:refreshLeaveBalances'));
      } else {
        toast.error(res.error || 'Failed to create leave request');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error creating leave request';
      toast.error(errorMsg);
    }
  };

  const handleEditReason = async (id: string, currentReason: string | null) => {
    const newReason = window.prompt('Enter new reason:', currentReason || '');
    if (newReason === null) return;
    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.leaveRequests.update(id, { reason: newReason });
      if (res.success) {
        toast.success('Reason updated');
        loadData();
      } else {
        toast.error(res.error || 'Failed to update reason');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating reason');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.leaveRequests.approve(id, {
        approverRemarks: 'Approved from UI',
      });
      if (res.success) {
        toast.success('Request approved');
        loadData();
        window.dispatchEvent(new Event('vyora:refreshLeaveBalances'));
      } else {
        toast.error(res.error || 'Failed to approve request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error approving request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    const remarks = window.prompt('Enter rejection remarks (optional):', '');
    if (remarks === null) return;
    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.leaveRequests.reject(id, { approverRemarks: remarks });
      if (res.success) {
        toast.success('Request rejected');
        loadData();
        window.dispatchEvent(new Event('vyora:refreshLeaveBalances'));
      } else {
        toast.error(res.error || 'Failed to reject request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error rejecting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    const remarks = window.prompt('Enter cancellation remarks (optional):', '');
    if (remarks === null) return;
    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.leaveRequests.cancel(id, { remarks: remarks });
      if (res.success) {
        toast.success('Request cancelled');
        loadData();
        window.dispatchEvent(new Event('vyora:refreshLeaveBalances'));
      } else {
        toast.error(res.error || 'Failed to cancel request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cancelling request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<LeaveRequestDto>[] = [
    {
      key: 'leaveTypeId',
      header: 'Leave Type',
      cell: (row) => {
        const lt = leaveTypes.find((l) => l.id === row.leaveTypeId);
        return lt ? lt.name : 'Unknown';
      },
    },
    {
      key: 'fromDate',
      header: 'From',
      cell: (row) => new Date(row.fromDate).toLocaleDateString(),
    },
    {
      key: 'toDate',
      header: 'To',
      cell: (row) => new Date(row.toDate).toLocaleDateString(),
    },
    { key: 'requestedDays', header: 'Days' },
    { key: 'reason', header: 'Reason' },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        let variant: 'default' | 'success' | 'destructive' | 'warning' = 'default';
        if (row.status === 'Approved') variant = 'success';
        if (row.status === 'Rejected') variant = 'destructive';
        if (row.status === 'Cancelled') variant = 'default';
        if (row.status === 'Pending') variant = 'warning';
        return <StatusBadge variant={variant}>{row.status}</StatusBadge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => {
        return (
          <div className="flex justify-end gap-1">
            {row.status === 'Pending' && (
              <>
                <AppButton
                  variant="ghost"
                  size="sm"
                  title="Edit Reason"
                  onClick={() => handleEditReason(row.id, row.reason)}
                  disabled={isSubmitting}
                >
                  <Edit className="h-4 w-4" />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  title="Approve"
                  className="text-success hover:bg-success/10"
                  onClick={() => handleApprove(row.id)}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4" />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  title="Reject"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleReject(row.id)}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4" />
                </AppButton>
              </>
            )}
            {(row.status === 'Pending' || row.status === 'Approved') && (
              <AppButton
                variant="ghost"
                size="sm"
                title="Cancel Request"
                onClick={() => handleCancel(row.id)}
                disabled={isSubmitting}
              >
                <XSquare className="h-4 w-4" />
              </AppButton>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AppCard className="mt-6 p-6 shadow-sm md:col-span-2">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <FileText className="text-muted-foreground h-5 w-5" />
          <h3 className="text-lg font-medium">Leave Requests</h3>
        </div>
        <AppButton size="sm" onClick={() => setIsFormOpen(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Request Leave
        </AppButton>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
      />

      <LeaveRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        employeeId={employeeId}
        leaveTypes={leaveTypes}
        financialYears={financialYears}
      />
    </AppCard>
  );
}
