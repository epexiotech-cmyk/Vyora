'use client';

import { LeaveRequestDto, LeaveTypeDto, EmployeeDto } from '@vyora/types';
import { CheckCircle, XCircle, XSquare } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function GlobalLeaveRequests() {
  const [requests, setRequests] = React.useState<LeaveRequestDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [reqRes, ltRes, empRes] = await Promise.all([
        window.vyora.db.leaveRequests.search({ limit: 1000 }), // Get all active company leave requests
        window.vyora.db.leaveTypes.getAll(),
        window.vyora.db.employees.search({ limit: 1000 }), // Load employees to map names
      ]);
      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data.items);
      }
      if (ltRes.success && ltRes.data) {
        setLeaveTypes(ltRes.data);
      }
      if (empRes.success && empRes.data) {
        const empData = empRes.data as unknown as { data?: EmployeeDto[]; items?: EmployeeDto[] };
        setEmployees(empData.data || empData.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    try {
      setIsSubmitting(true);
      const res = await window.vyora.db.leaveRequests.approve(id, {
        approverRemarks: 'Approved from Global UI',
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
      key: 'employeeId',
      header: 'Employee',
      cell: (row) => {
        const emp = employees.find((e) => e.id === row.employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
      },
    },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Leave Requests</h1>
          <p className="text-muted-foreground">
            Manage and approve employee leave requests across the company.
          </p>
        </div>
      </div>
      <AppCard className="p-6">
        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
        />
      </AppCard>
    </div>
  );
}
