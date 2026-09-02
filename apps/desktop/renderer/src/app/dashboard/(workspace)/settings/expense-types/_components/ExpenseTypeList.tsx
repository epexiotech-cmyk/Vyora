'use client';

import { ExpensePresetDto, LedgerDto, LedgerGroupDto } from '@vyora/types';
import { Plus } from 'lucide-react';
import * as React from 'react';

import { ExpenseTypeDialog } from './ExpenseTypeDialog';
import { ExpenseTypeFormPayload } from './ExpenseTypeForm';
import { ExpenseTypeTable } from './ExpenseTypeTable';
import { useExpenseTypes } from '../hooks/useExpenseTypes';

import { AppButton } from '@/components/ui/AppButton';

export function ExpenseTypeList() {
  const {
    data: expenseTypes,
    isLoading: isLoadingTypes,
    fetchExpenseTypes,
    createExpenseType,
    updateExpenseType,
    deactivateExpenseType,
  } = useExpenseTypes();

  const [ledgers, setLedgers] = React.useState<LedgerDto[]>([]);
  const [expenseLedgers, setExpenseLedgers] = React.useState<LedgerDto[]>([]);
  const [isLoadingLedgers, setIsLoadingLedgers] = React.useState(false);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<ExpensePresetDto | null>(null);

  React.useEffect(() => {
    fetchExpenseTypes();
  }, [fetchExpenseTypes]);

  // Fetch ledgers and groups to filter to Expense ledgers only
  React.useEffect(() => {
    let mounted = true;
    const loadLedgers = async () => {
      try {
        setIsLoadingLedgers(true);
        // Fetch active ledgers and all groups
        const [ledgersRes, groupsRes] = await Promise.all([
          window.vyora.accounting.ledgers.search({ isActive: true, limit: 1000 }),
          window.vyora.accounting.groups.getAll(),
        ]);

        if (mounted && ledgersRes.success && groupsRes.success) {
          const allLedgers = ledgersRes.data?.data || [];
          const allGroups = groupsRes.data || [];

          setLedgers(allLedgers);

          // Build a map of groups and resolve their top-level nature
          const groupMap = new Map<string, LedgerGroupDto>();
          allGroups.forEach((g) => groupMap.set(g.id, g));

          const resolveNature = (groupId: string): string | null => {
            let currentId: string | null | undefined = groupId;
            // safeguard against loops
            let depth = 0;
            while (currentId && depth < 20) {
              const group = groupMap.get(currentId);
              if (!group) return null;
              if (group.nature) return group.nature;
              currentId = group.parentGroupId;
              depth++;
            }
            return null;
          };

          // Filter to only those whose resolved nature is 'Expense'
          const filtered = allLedgers.filter((ledger) => {
            const nature = resolveNature(ledger.groupId);
            return nature === 'Expense';
          });

          setExpenseLedgers(filtered);
        }
      } catch (err) {
        console.error('Failed to load ledgers', err);
      } finally {
        if (mounted) setIsLoadingLedgers(false);
      }
    };

    loadLedgers();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateNew = () => {
    setSelectedPreset(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (preset: ExpensePresetDto) => {
    setSelectedPreset(preset);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (payload: ExpenseTypeFormPayload) => {
    if (selectedPreset?.id) {
      await updateExpenseType({ ...payload, id: selectedPreset.id });
    } else {
      await createExpenseType(payload);
    }
    await fetchExpenseTypes();
  };

  const handleDeactivate = async (id: string) => {
    await deactivateExpenseType(id);
    await fetchExpenseTypes();
  };

  const handleActivate = async (id: string) => {
    await updateExpenseType({ id, isActive: true });
    await fetchExpenseTypes();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Expense Types</h2>
        <AppButton onClick={handleCreateNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Expense Type
        </AppButton>
      </div>

      <div className="bg-card text-card-foreground rounded-md border shadow-sm">
        <div className="p-4">
          {isLoadingTypes ? (
            <div className="flex h-32 items-center justify-center">
              <span className="text-muted-foreground text-sm">Loading expense types...</span>
            </div>
          ) : expenseTypes.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <span className="text-muted-foreground text-sm">No expense types found.</span>
              <AppButton variant="outline" size="sm" onClick={handleCreateNew}>
                Create one now
              </AppButton>
            </div>
          ) : (
            <ExpenseTypeTable
              data={expenseTypes}
              ledgers={ledgers} // pass all ledgers for display names
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
            />
          )}
        </div>
      </div>

      <ExpenseTypeDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={selectedPreset}
        onSubmit={handleSubmit}
        ledgers={expenseLedgers} // only pass expense ledgers for selection
        isLoadingLedgers={isLoadingLedgers}
      />
    </div>
  );
}
