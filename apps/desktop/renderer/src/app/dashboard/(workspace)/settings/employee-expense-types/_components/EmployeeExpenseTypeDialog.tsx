import { EmployeeExpenseTypeDto, LedgerDto } from '@vyora/types';
import * as React from 'react';

import { EmployeeExpenseTypeForm, EmployeeExpenseTypeFormPayload } from './EmployeeExpenseTypeForm';

import { AppModal } from '@/components/shared/modal/AppModal';

interface EmployeeExpenseTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EmployeeExpenseTypeDto | null;
  onSubmit: (data: EmployeeExpenseTypeFormPayload) => Promise<void>;
  ledgers: LedgerDto[];
  isLoadingLedgers: boolean;
}

export function EmployeeExpenseTypeDialog({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  ledgers,
  isLoadingLedgers,
}: EmployeeExpenseTypeDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const formId = 'expense-type-form';
  const isEditing = !!initialData?.id;

  const handleSubmit = async (data: EmployeeExpenseTypeFormPayload) => {
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
      <EmployeeExpenseTypeForm
        id={formId}
        initialData={initialData}
        onSubmit={handleSubmit}
        ledgers={ledgers}
        isLoadingLedgers={isLoadingLedgers}
      />
    </AppModal>
  );
}
