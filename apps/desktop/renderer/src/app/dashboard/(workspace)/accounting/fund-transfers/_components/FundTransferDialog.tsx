import { FundTransferDto, CreateFundTransferInput } from '@vyora/types';
import React from 'react';

import { useFundTransfers } from '../hooks/useFundTransfers';

import { FundTransferForm } from './FundTransferForm';

import { AppModal } from '@/components/shared/modal/AppModal';

interface FundTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transferToEdit?: FundTransferDto | null;
}

export function FundTransferDialog({ isOpen, onClose, transferToEdit }: FundTransferDialogProps) {
  const { createTransfer, updateTransfer, isCreating, isUpdating } = useFundTransfers({});

  const handleSubmit = async (data: CreateFundTransferInput) => {
    try {
      if (transferToEdit) {
        await updateTransfer({ id: transferToEdit.id, input: data });
      } else {
        await createTransfer(data);
      }
      onClose();
    } catch {
      // Error is handled in the hook
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={transferToEdit ? 'Edit Fund Transfer' : 'New Fund Transfer'}
      hideActions
    >
      <div className="max-w-2xl">
        <FundTransferForm
          initialData={transferToEdit || undefined}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isCreating || isUpdating}
        />
      </div>
    </AppModal>
  );
}
