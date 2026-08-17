'use client';

import { LedgerGroupDto, LedgerDto } from '@vyora/types';
import * as React from 'react';
import { toast } from 'sonner';

import { LedgerForm } from './_components/LedgerForm';
import { LedgerGroupForm } from './_components/LedgerGroupForm';
import { LedgerGroupTable } from './_components/LedgerGroupTable';
import { LedgerTable } from './_components/LedgerTable';
import { useLedgers } from './hooks/useLedgers';

import { AppModal } from '@/components/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ChartOfAccountsPage() {
  const [data, setData] = React.useState<LedgerGroupDto[]>([]);
  const [allGroups, setAllGroups] = React.useState<LedgerGroupDto[]>([]); // For parent selection
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const limit = 20;

  const {
    data: ledgers,
    totalRecords: ledgersTotal,
    isLoading: isLedgersLoading,
    fetchLedgers,
    deactivateLedger,
  } = useLedgers();
  const [ledgersPage, setLedgersPage] = React.useState(1);
  const [ledgersSearch, setLedgersSearch] = React.useState('');

  // Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<LedgerGroupDto | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = React.useState(false);
  const [editingLedger, setEditingLedger] = React.useState<LedgerDto | null>(null);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('action') === 'new-ledger') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLedgerModalOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchGroups = React.useCallback(async () => {
    try {
      const res = await window.vyora.accounting.groups.search({
        query: searchQuery,
        limit,
        offset: (page - 1) * limit,
      });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      }

      const allRes = await window.vyora.accounting.groups.getAll();
      if (allRes.success && allRes.data) {
        setAllGroups(allRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch ledger groups:', error);
    }
  }, [searchQuery, page, limit]);

  const loadLedgers = React.useCallback(async () => {
    await fetchLedgers({
      query: ledgersSearch,
      limit,
      offset: (ledgersPage - 1) * limit,
    });
  }, [ledgersSearch, ledgersPage, limit, fetchLedgers]);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchGroups(), loadLedgers()]);
      if (mounted) setIsLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fetchGroups, loadLedgers]);

  const handleCreateOrEditGroup = (group?: LedgerGroupDto) => {
    setEditingGroup(group || null);
    setIsGroupModalOpen(true);
  };

  const handleGroupSuccess = async () => {
    setIsGroupModalOpen(false);
    await fetchGroups();
  };

  const handleCreateOrEditLedger = (ledger?: LedgerDto) => {
    setEditingLedger(ledger || null);
    setIsLedgerModalOpen(true);
  };

  const handleLedgerSuccess = async () => {
    setIsLedgerModalOpen(false);
    await loadLedgers();
  };

  const handleDeactivateGroup = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this ledger group?')) {
      try {
        const res = await window.vyora.accounting.groups.delete(id);
        if (res.success) {
          toast.success('Ledger group deactivated successfully');
          await fetchGroups();
        } else {
          toast.error(res.error || 'Failed to deactivate group');
        }
      } catch {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleDeactivateLedger = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this ledger?')) {
      try {
        await deactivateLedger(id);
        toast.success('Ledger deactivated successfully');
        await loadLedgers();
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message || 'Failed to deactivate ledger');
        } else {
          toast.error('Failed to deactivate ledger');
        }
      }
    }
  };

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader
          title="Chart of Accounts"
          description="Manage ledger groups for your company."
        />
      </div>

      <div className="flex flex-1 flex-col gap-8 overflow-auto">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Ledger Groups</h2>
          <LedgerGroupTable
            data={data}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onEdit={handleCreateOrEditGroup}
            onDeactivate={handleDeactivateGroup}
            onAdd={() => handleCreateOrEditGroup()}
            page={page}
            onPageChange={setPage}
            totalRecords={totalRecords}
            limit={limit}
          />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Ledgers</h2>
          <LedgerTable
            data={ledgers}
            groups={allGroups}
            isLoading={isLedgersLoading}
            searchQuery={ledgersSearch}
            onSearchChange={(q) => {
              setLedgersSearch(q);
              setLedgersPage(1);
            }}
            onEdit={handleCreateOrEditLedger}
            onDeactivate={handleDeactivateLedger}
            onAdd={() => handleCreateOrEditLedger()}
            page={ledgersPage}
            onPageChange={setLedgersPage}
            totalRecords={ledgersTotal}
            limit={limit}
          />
        </div>
      </div>

      {/* Group Modal */}
      <AppModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? 'Edit Ledger Group' : 'Add Ledger Group'}
        description={
          editingGroup ? 'Update the ledger group details below.' : 'Create a new ledger group.'
        }
        hideActions={true}
      >
        <LedgerGroupForm
          initialData={editingGroup}
          groups={allGroups}
          onClose={() => setIsGroupModalOpen(false)}
          onSuccess={handleGroupSuccess}
        />
      </AppModal>

      {/* Ledger Modal */}
      <AppModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={
          editingLedger
            ? editingLedger.isSystemAccount ||
              editingLedger.referenceType === 'CUSTOMER' ||
              editingLedger.referenceType === 'SUPPLIER' ||
              editingLedger.isFrozen
              ? 'View Ledger'
              : 'Edit Ledger'
            : 'Add Ledger'
        }
        description={
          editingLedger ? 'View or update the ledger details below.' : 'Create a new ledger.'
        }
        hideActions={true}
      >
        <LedgerForm
          initialData={editingLedger}
          groups={allGroups}
          onClose={() => setIsLedgerModalOpen(false)}
          onSuccess={handleLedgerSuccess}
        />
      </AppModal>
    </div>
  );
}
