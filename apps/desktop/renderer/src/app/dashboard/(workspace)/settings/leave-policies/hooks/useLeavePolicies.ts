import {
  CreateLeavePolicyInput,
  LeavePolicyDto,
  SearchLeavePoliciesOptions,
  UpdateLeavePolicyInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useLeavePolicies() {
  const [data, setData] = useState<LeavePolicyDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeavePolicies = useCallback(async (options?: SearchLeavePoliciesOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.leavePolicies.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch leave policies');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching leave policies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLeavePolicy = async (input: CreateLeavePolicyInput) => {
    const res = await window.vyora.db.leavePolicies.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create leave policy');
    return res.data;
  };

  const updateLeavePolicy = async (id: string, input: UpdateLeavePolicyInput) => {
    const res = await window.vyora.db.leavePolicies.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update leave policy');
    return res.data;
  };

  const deleteLeavePolicy = async (id: string) => {
    const res = await window.vyora.db.leavePolicies.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete leave policy');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    deleteLeavePolicy,
  };
}
