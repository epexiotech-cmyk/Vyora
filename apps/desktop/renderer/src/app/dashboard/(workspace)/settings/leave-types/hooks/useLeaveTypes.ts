import {
  CreateLeaveTypeInput,
  LeaveTypeDto,
  SearchLeaveTypesOptions,
  UpdateLeaveTypeInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useLeaveTypes() {
  const [data, setData] = useState<LeaveTypeDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaveTypes = useCallback(async (options?: SearchLeaveTypesOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.leaveTypes.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch leave types');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching leave types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLeaveType = async (input: CreateLeaveTypeInput) => {
    const res = await window.vyora.db.leaveTypes.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create leave type');
    return res.data;
  };

  const updateLeaveType = async (id: string, input: UpdateLeaveTypeInput) => {
    const res = await window.vyora.db.leaveTypes.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update leave type');
    return res.data;
  };

  const deleteLeaveType = async (id: string) => {
    const res = await window.vyora.db.leaveTypes.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete leave type');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  };
}
