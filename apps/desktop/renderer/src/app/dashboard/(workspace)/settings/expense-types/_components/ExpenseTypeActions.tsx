import { ExpensePresetDto } from '@vyora/types';
import { MoreHorizontal, Edit, Ban, Play } from 'lucide-react';
import * as React from 'react';

import {
  AppDropdownMenu,
  AppDropdownItemOrSeparator,
} from '@/components/shared/menu/AppDropdownMenu';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';

interface ExpenseTypeActionsProps {
  expenseType: ExpensePresetDto;
  onEdit: (expenseType: ExpensePresetDto) => void;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}

export function ExpenseTypeActions({
  expenseType,
  onEdit,
  onActivate,
  onDeactivate,
}: ExpenseTypeActionsProps) {
  const [isDeactivateOpen, setIsDeactivateOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const items: AppDropdownItemOrSeparator[] = [];

  // Edit is always available to view details, though System presets will have readonly inputs for ledger
  items.push({
    key: 'edit',
    label: 'Edit',
    icon: <Edit />,
    onClick: () => onEdit(expenseType),
  });

  // Only non-system presets can be deactivated or activated
  if (!expenseType.isSystem) {
    if (expenseType.isActive) {
      items.push({
        key: 'deactivate',
        label: 'Deactivate',
        icon: <Ban />,
        onClick: () => setIsDeactivateOpen(true),
      });
    } else {
      items.push({
        key: 'activate',
        label: 'Activate',
        icon: <Play />,
        onClick: async () => {
          setIsProcessing(true);
          try {
            await onActivate(expenseType.id);
          } finally {
            setIsProcessing(false);
          }
        },
      });
    }
  }

  return (
    <>
      <AppDropdownMenu
        trigger={
          <AppButton variant="ghost" size="icon" disabled={isProcessing}>
            <MoreHorizontal className="h-4 w-4" />
          </AppButton>
        }
        items={items}
        align="end"
      />

      <AppModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        title="Deactivate Expense Type"
        description={`Are you sure you want to deactivate "${expenseType.name}"? It will no longer be available when recording new expenses.`}
        confirmLabel="Deactivate"
        isLoading={isProcessing}
        onConfirm={async () => {
          setIsProcessing(true);
          try {
            await onDeactivate(expenseType.id);
            setIsDeactivateOpen(false);
          } finally {
            setIsProcessing(false);
          }
        }}
      />
    </>
  );
}
