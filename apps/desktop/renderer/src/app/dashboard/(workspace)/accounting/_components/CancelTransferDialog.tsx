import * as React from 'react';
import { toast } from 'sonner';

import { AppModal } from '@/components/shared/modal/AppModal';

interface CancelTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucherId: string | null;
  voucherNumber: string;
  amountFormatted: string;
  sourceAccount: string;
  destinationAccount: string;
  onSuccess: () => void;
}

export function CancelTransferDialog({
  isOpen,
  onClose,
  voucherId,
  voucherNumber,
  amountFormatted,
  sourceAccount,
  destinationAccount,
  onSuccess,
}: CancelTransferDialogProps) {
  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleConfirm = async () => {
    if (!voucherId) return;

    setIsCancelling(true);
    try {
      const res = await window.vyora.journal.cancelTransfer(voucherId);
      if (res.success) {
        toast.success('The transfer has been successfully cancelled and reversed.');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to cancel transfer.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel this transfer?"
      description={`${amountFormatted} transfer from ${sourceAccount} to ${destinationAccount} (Voucher: ${voucherNumber}) will be reversed.`}
      confirmLabel="Confirm Cancellation"
      onConfirm={handleConfirm}
      isLoading={isCancelling}
    >
      <div className="pt-2">
        <p className="text-muted-foreground text-sm">
          This action will create a reversal voucher to negate the accounting impact. The original
          transfer will remain visible for auditing but will be marked as cancelled.
        </p>
      </div>
    </AppModal>
  );
}
