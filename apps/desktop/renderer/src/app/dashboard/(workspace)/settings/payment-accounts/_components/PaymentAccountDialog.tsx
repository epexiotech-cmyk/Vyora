import { PaymentAccountDto, VoucherDetailDto } from '@vyora/types';
import * as React from 'react';

import { PaymentAccountForm, PaymentAccountFormPayload } from './PaymentAccountForm';

import { AppModal } from '@/components/shared/modal/AppModal';

interface PaymentAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PaymentAccountDto | null;
  onSubmit: (data: PaymentAccountFormPayload) => Promise<void>;
  fetchOpeningBalance: (id: string) => Promise<VoucherDetailDto | null | undefined>;
}

export function PaymentAccountDialog({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  fetchOpeningBalance,
}: PaymentAccountDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [initialOpeningBalance, setInitialOpeningBalance] = React.useState<{
    amount: number;
    type: 'Dr' | 'Cr';
    date: Date;
  } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(false);

  const formId = 'payment-account-form';
  const isEditing = !!initialData?.id;

  React.useEffect(() => {
    let ignore = false;
    if (isOpen && initialData?.id) {
      void Promise.resolve().then(() => {
        if (!ignore) setIsLoadingBalance(true);
      });
      fetchOpeningBalance(initialData.id)
        .then((res) => {
          if (!ignore && res) {
            const accountEntry = res.entries?.find((e) => e.ledgerId === initialData.id);
            const type = (accountEntry?.debitAmount || 0) > 0 ? 'Dr' : 'Cr';
            const amount =
              accountEntry?.debitAmount || accountEntry?.creditAmount || res.totalDebit || 0;

            setInitialOpeningBalance({
              amount,
              type,
              date: res.voucherDate ? new Date(res.voucherDate) : new Date(),
            });
          }
        })
        .finally(() => {
          if (!ignore) setIsLoadingBalance(false);
        });
    } else {
      void Promise.resolve().then(() => {
        if (!ignore) setInitialOpeningBalance(null);
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, initialData?.id, fetchOpeningBalance]);

  const handleSubmit = async (data: PaymentAccountFormPayload) => {
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
      title={isEditing ? 'Edit Payment Account' : 'Create Payment Account'}
      description={
        isEditing
          ? 'Update the details for this payment account.'
          : 'Add a new payment account to your company.'
      }
      confirmLabel={isSaving ? 'Saving...' : 'Save'}
      isLoading={isSaving || isLoadingBalance}
      onConfirm={() => {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }}
    >
      {!isLoadingBalance && (
        <PaymentAccountForm
          initialData={initialData}
          initialOpeningBalance={initialOpeningBalance}
          onSubmitAction={handleSubmit}
          isSaving={isSaving}
          formId={formId}
        />
      )}
    </AppModal>
  );
}
