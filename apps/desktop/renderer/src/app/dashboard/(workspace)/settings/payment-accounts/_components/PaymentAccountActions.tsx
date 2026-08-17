import { PaymentAccountDto } from '@vyora/types';
import { MoreHorizontal, Edit, CheckCircle, Ban, Play, Trash } from 'lucide-react';
import * as React from 'react';

import {
  AppDropdownMenu,
  AppDropdownItemOrSeparator,
} from '@/components/shared/menu/AppDropdownMenu';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';

interface PaymentAccountActionsProps {
  account: PaymentAccountDto;
  onEdit: (account: PaymentAccountDto) => void;
  onSetDefault: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PaymentAccountActions({
  account,
  onEdit,
  onSetDefault,
  onActivate,
  onDeactivate,
  onDelete,
}: PaymentAccountActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = React.useState(false);
  const [isSetDefaultOpen, setIsSetDefaultOpen] = React.useState(false);

  const items: AppDropdownItemOrSeparator[] = [];

  if (account.capabilities?.canEdit) {
    items.push({
      key: 'edit',
      label: 'Edit',
      icon: <Edit />,
      onClick: () => onEdit(account),
    });
  }

  if (!account.isDefault && account.isActive) {
    items.push({
      key: 'set-default',
      label: 'Set as default',
      icon: <CheckCircle />,
      onClick: () => setIsSetDefaultOpen(true),
    });
  }

  if (account.capabilities?.canDeactivate) {
    items.push({
      key: 'deactivate',
      label: 'Deactivate',
      icon: <Ban />,
      onClick: () => setIsDeactivateOpen(true),
    });
  }

  if (account.capabilities?.canActivate) {
    items.push({
      key: 'activate',
      label: 'Activate',
      icon: <Play />,
      onClick: () => onActivate(account.id),
    });
  }

  if (account.capabilities?.canDelete !== undefined) {
    items.push('separator');

    if (account.capabilities.canDelete) {
      items.push({
        key: 'delete',
        label: 'Delete',
        icon: <Trash />,
        danger: true,
        onClick: () => setIsDeleteOpen(true),
      });
    } else if (
      !account.isSystem &&
      account.capabilities.hasNonOpeningLedgerEntries &&
      account.isActive
    ) {
      // If we can't delete it due to history, we can offer to Archive/Deactivate it instead
      // but only if it's currently active.
      items.push({
        key: 'deactivate-archive',
        label: 'Deactivate / Archive',
        icon: <Ban />,
        onClick: () => setIsDeactivateOpen(true),
      });
    }
  }

  const trigger = (
    <AppButton
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground h-8 w-8"
    >
      <MoreHorizontal className="h-4 w-4" />
    </AppButton>
  );

  return (
    <>
      <div className="flex items-center justify-end">
        <AppDropdownMenu trigger={trigger} items={items} />
      </div>

      <AppModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Payment Account"
        description={`Are you sure you want to delete ${account.displayName}? This action cannot be undone.`}
        onConfirm={async () => {
          try {
            await onDelete(account.id);
            setIsDeleteOpen(false);
          } catch {
            // Error handled by onDelete, leave modal open
          }
        }}
        confirmLabel="Delete"
      />

      <AppModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        title="Deactivate Payment Account"
        description={`Are you sure you want to deactivate ${account.displayName}? It will no longer be available for new transactions.`}
        onConfirm={async () => {
          await onDeactivate(account.id);
          setIsDeactivateOpen(false);
        }}
        confirmLabel="Deactivate"
      />

      <AppModal
        isOpen={isSetDefaultOpen}
        onClose={() => setIsSetDefaultOpen(false)}
        title="Set Default Account"
        description={`Make ${account.displayName} the default ${account.accountType} account?`}
        onConfirm={async () => {
          await onSetDefault(account.id);
          setIsSetDefaultOpen(false);
        }}
        confirmLabel="Set Default"
      />
    </>
  );
}
