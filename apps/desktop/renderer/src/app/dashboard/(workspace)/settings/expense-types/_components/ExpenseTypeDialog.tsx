import { ExpensePresetDto, LedgerDto } from '@vyora/types';
import * as React from 'react';

import { ExpenseTypeForm, ExpenseTypeFormPayload } from './ExpenseTypeForm';

import { AppModal } from '@/components/shared/modal/AppModal';

interface ExpenseTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExpensePresetDto | null;
  onSubmit: (data: ExpenseTypeFormPayload) => Promise<void>;
  ledgers: LedgerDto[];
  isLoadingLedgers: boolean;
}

export function ExpenseTypeDialog({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  ledgers,
  isLoadingLedgers,
}: ExpenseTypeDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const formId = 'expense-type-form';
  const isEditing = !!initialData?.id;

  const handleSubmit = async (data: ExpenseTypeFormPayload) => {
    try {
      setIsSaving(true);
      await onSubmit(data);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Type' : 'Create Expense Type'}
      description={
        isEditing
          ? 'Update the details for this expense type.'
          : 'Add a new expense type to categorize your expenses.'
      }
      confirmLabel={isSaving ? 'Saving...' : 'Save'}
      isLoading={isSaving || isLoadingLedgers}
      onConfirm={() => {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }}
    >
      <ExpenseTypeForm
        id={formId}
        initialData={initialData}
        onSubmit={handleSubmit}
        ledgers={ledgers}
        isLoadingLedgers={isLoadingLedgers}
      />
    </AppModal>
  );
}
