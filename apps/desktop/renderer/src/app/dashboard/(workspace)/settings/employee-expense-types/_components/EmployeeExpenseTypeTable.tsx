import { EmployeeExpenseTypeDto, LedgerDto } from '@vyora/types';
import * as React from 'react';

import { EmployeeExpenseTypeActions } from './EmployeeExpenseTypeActions';

import { DataTable, ColumnDef } from '@/components/shared';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface EmployeeExpenseTypeTableProps {
  data: EmployeeExpenseTypeDto[];
  ledgers: LedgerDto[];
  onEdit: (employeeExpenseType: EmployeeExpenseTypeDto) => void;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

export function EmployeeExpenseTypeTable({
  data,
  ledgers,
  onEdit,
  onActivate,
  onDeactivate,
}: EmployeeExpenseTypeTableProps) {
  const getLedgerName = React.useCallback(
    (ledgerId: string) => {
      return ledgers.find((l) => l.id === ledgerId)?.name || 'Unknown Ledger';
    },
    [ledgers],
  );

  const columns: ColumnDef<EmployeeExpenseTypeDto>[] = React.useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        cell: (row) => (
          <div className="flex flex-col gap-1 py-1.5">
            <span className="font-medium">{row.name}</span>
            {row.isSystem && (
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                System Type
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'ledger',
        header: 'Mapped Ledger',
        cell: (row) => <span className="text-muted-foreground">{getLedgerName(row.ledgerId)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => (
          <StatusBadge
            variant={row.isActive ? 'success' : 'secondary'}
            className="rounded-full px-2.5 py-1"
          >
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => (
          <EmployeeExpenseTypeActions
            employeeExpenseType={row}
            onEdit={onEdit}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
          />
        ),
      },
    ],
    [getLedgerName, onEdit, onActivate, onDeactivate],
  );

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    </div>
  );
}
