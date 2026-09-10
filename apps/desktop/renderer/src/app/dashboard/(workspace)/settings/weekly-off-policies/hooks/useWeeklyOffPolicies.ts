import {
  CreateWeeklyOffPolicyInput,
  WeeklyOffPolicyDto,
  SearchWeeklyOffPoliciesOptions,
  UpdateWeeklyOffPolicyInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useWeeklyOffPolicies() {
  const [data, setData] = useState<WeeklyOffPolicyDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeeklyOffPolicies = useCallback(async (options?: SearchWeeklyOffPoliciesOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.weeklyOffPolicies.search(
        options || { limit: 100, offset: 0 },
      );
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch weekly off policies');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching weekly off policies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWeeklyOffPolicy = async (input: CreateWeeklyOffPolicyInput) => {
    const res = await window.vyora.db.weeklyOffPolicies.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create weekly off policy');
    return res.data;
  };

  const updateWeeklyOffPolicy = async (id: string, input: UpdateWeeklyOffPolicyInput) => {
    const res = await window.vyora.db.weeklyOffPolicies.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update weekly off policy');
    return res.data;
  };

  const deleteWeeklyOffPolicy = async (id: string) => {
    const res = await window.vyora.db.weeklyOffPolicies.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete weekly off policy');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchWeeklyOffPolicies,
    createWeeklyOffPolicy,
    updateWeeklyOffPolicy,
    deleteWeeklyOffPolicy,
  };
}
