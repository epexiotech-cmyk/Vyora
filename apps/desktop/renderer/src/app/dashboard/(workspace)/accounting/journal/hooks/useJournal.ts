import {
  CreateVoucherInput,
  VoucherFilterDto,
  VoucherListItemDto,
  VoucherDetailDto,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useJournalVouchers(filter?: VoucherFilterDto) {
  const [data, setData] = useState<VoucherListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await window.vyora.accounting.listVouchers({
        ...filter,
        voucherType: 'Journal',
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vouchers');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  return { data, isLoading, fetchVouchers };
}

export function useJournalVoucher(id: string) {
  const [data, setData] = useState<VoucherDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVoucher = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await window.vyora.accounting.getVoucherById(id);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load voucher details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return { data, isLoading, fetchVoucher };
}

export function useCreateJournalVoucher() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (input: CreateVoucherInput) => {
    setIsPending(true);
    try {
      const res = await window.vyora.journal.postVoucher(input);
      if (!res.success) {
        throw new Error(res.error || 'Failed to post voucher');
      }
      toast.success('Journal voucher posted successfully');
      return res.data;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useCancelJournalVoucher() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (id: string) => {
    setIsPending(true);
    try {
      const res = await window.vyora.journal.cancelVoucher(id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to cancel voucher');
      }
      toast.success('Journal voucher cancelled successfully');
      return res.data;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useReverseJournalVoucher() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (id: string) => {
    setIsPending(true);
    try {
      const res = await window.vyora.journal.reverseVoucher(id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to reverse voucher');
      }
      toast.success('Journal voucher reversed successfully');
      return res.data;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
