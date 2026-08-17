'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { JournalTable } from './_components/JournalTable';
import {
  useCancelJournalVoucher,
  useJournalVouchers,
  useReverseJournalVoucher,
} from './hooks/useJournal';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function JournalEntriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filter = React.useMemo(
    () => ({
      searchQuery: searchQuery || undefined,
    }),
    [searchQuery],
  );

  const { data: vouchersData, isLoading, fetchVouchers } = useJournalVouchers(filter);

  React.useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const { mutateAsync: cancelVoucher } = useCancelJournalVoucher();
  const { mutateAsync: reverseVoucher } = useReverseJournalVoucher();

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this journal voucher?')) {
      try {
        await cancelVoucher(id);
        fetchVouchers();
      } catch {
        // Error handled in hook
      }
    }
  };

  const handleReverse = async (id: string) => {
    if (
      confirm(
        'Are you sure you want to reverse this journal voucher? A new reversal voucher will be posted.',
      )
    ) {
      try {
        await reverseVoucher(id);
        fetchVouchers();
      } catch {
        // Error handled in hook
      }
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Journal Entries" description="Manage your manual journal entries" />

      <JournalTable
        data={vouchersData || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onView={(id) => router.push(`/dashboard/accounting/journal/${id}`)}
        onCancel={handleCancel}
        onReverse={handleReverse}
        onAdd={() => router.push('/dashboard/accounting/journal/new')}
      />
    </div>
  );
}
