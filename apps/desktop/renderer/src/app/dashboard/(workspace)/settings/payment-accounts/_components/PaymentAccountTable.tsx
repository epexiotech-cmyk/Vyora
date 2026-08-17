import { PaymentAccountDto, PaymentAccountType } from '@vyora/types';
import { Landmark, Smartphone, CreditCard, Wallet } from 'lucide-react';
import * as React from 'react';

import { PaymentAccountActions } from './PaymentAccountActions';

import { DataTable, ColumnDef } from '@/components/shared';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PaymentAccountTableProps {
  data: PaymentAccountDto[];
  isLoading: boolean;
  onEdit: (account: PaymentAccountDto) => void;
  onSetDefault: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const getBadgeStyles = (type: PaymentAccountType) => {
  switch (type) {
    case 'BANK':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Landmark className="h-3.5 w-3.5" />,
      };
    case 'UPI':
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Smartphone className="h-3.5 w-3.5" />,
      };
    case 'POS':
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <CreditCard className="h-3.5 w-3.5" />,
      };
    case 'CASH':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <Wallet className="h-3.5 w-3.5" />,
      };
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: null };
  }
};

const maskAccountNumber = (accNumber: string | null | undefined) => {
  if (!accNumber) return '-';
  if (accNumber.length <= 4) return accNumber;
  const visible = accNumber.slice(-4);
  const hiddenPart = 'X'.repeat(accNumber.length - 4);
  // Try to group by 4, then append visible part if using dashes, but XXXXXXXX3123 format means just padding.
  // The user explicitly requested XXXX-XXXX-3123
  // A generic way to format this dynamically:
  const mask = (hiddenPart + visible).match(/.{1,4}/g)?.join('-') || '-';
  return mask;
};

export function PaymentAccountTable({
  data,
  isLoading,
  onEdit,
  onSetDefault,
  onActivate,
  onDeactivate,
  onDelete,
}: PaymentAccountTableProps) {
  const columns: ColumnDef<PaymentAccountDto>[] = React.useMemo(
    () => [
      {
        key: 'displayName',
        header: 'Display Name',
        cell: (row) => (
          <div className="flex flex-col gap-1 py-1.5">
            <span className="font-medium">{row.displayName}</span>
            {row.isSystem && (
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                System Account
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'accountType',
        header: 'Account Type',
        cell: (row) => {
          const style = getBadgeStyles(row.accountType);
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.color}`}
            >
              {style.icon}
              {row.accountType}
            </span>
          );
        },
      },
      {
        key: 'bankName',
        header: 'Bank Name',
        cell: (row) => row.bankName || '-',
      },
      {
        key: 'accountNumber',
        header: 'Account Number',
        cell: (row) => (
          <span className="font-mono text-sm tracking-wider">
            {maskAccountNumber(row.accountNumber)}
          </span>
        ),
      },
      {
        key: 'upiId',
        header: 'UPI ID',
        cell: (row) => row.upiId || '-',
      },
      {
        key: 'isDefault',
        header: 'Default',
        cell: (row) =>
          row.isDefault ? (
            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Default
            </span>
          ) : null,
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
          <PaymentAccountActions
            account={row}
            onEdit={onEdit}
            onSetDefault={onSetDefault}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [onEdit, onSetDefault, onActivate, onDeactivate, onDelete],
  );

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading payment accounts...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="bg-secondary/50 flex h-12 w-12 items-center justify-center rounded-full">
          <Wallet className="text-muted-foreground h-6 w-6" />
        </div>
        <div>
          <p className="text-foreground mb-1 text-lg font-medium">No payment accounts found.</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Create your first bank account, UPI account, cash account, or POS account to begin.
          </p>
        </div>
      </div>
    );
  }

  return <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />;
}
