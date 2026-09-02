import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FormSelect } from '@/components/forms/FormSelect';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import { AppDatePicker } from '@/components/shared/form/AppDatePicker';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';

const renderBalance = (amountPaise: number, type: string, baseClassName = '') => {
  if (amountPaise === 0) {
    return <span className={`text-muted-foreground ${baseClassName}`}>₹0.00</span>;
  }
  const isPositive = type === 'DR' || type === 'Dr';
  const prefix = isPositive ? '+' : '−';
  const colorClass = isPositive
    ? 'text-green-600 dark:text-green-500'
    : 'text-red-600 dark:text-red-500';
  const amountStr = (amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return (
    <span className={`${colorClass} ${baseClassName}`}>
      {prefix}₹{amountStr}
    </span>
  );
};

const transferSchema = z.object({
  direction: z.enum(['TO', 'FROM']),
  counterpartyId: z.string().min(1, 'Counterparty is required'),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  transferDate: z.date(),
  narration: z.string().optional(),
});

type TransferFormPayload = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountId: string | null;
  selectedAccountName: string;
  onSuccess: () => void;
  initialData?: {
    voucherId: string;
    fromPaymentAccountId: string;
    toPaymentAccountId: string;
    amount: number; // in paise
    transferDate: Date;
    narration?: string;
  };
}

export function TransferDialog({
  isOpen,
  onClose,
  selectedAccountId,
  selectedAccountName,
  onSuccess,
  initialData,
}: TransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sourceBalance, setSourceBalance] = React.useState<{
    amount: number;
    type: 'Dr' | 'Cr';
  } | null>(null);
  const [destBalance, setDestBalance] = React.useState<{
    amount: number;
    type: 'Dr' | 'Cr';
  } | null>(null);
  const [isFetchingBalances, setIsFetchingBalances] = React.useState(false);

  const [successData, setSuccessData] = React.useState<{
    amount: number;
    voucherNumber: string;
    transferDate: Date;
    sourceName: string;
    destName: string;
    sourceBalance: { amount: number; type: 'Dr' | 'Cr' };
    destBalance: { amount: number; type: 'Dr' | 'Cr' };
  } | null>(null);

  const isEdit = !!initialData;

  const methods = useForm<TransferFormPayload>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      direction: 'TO',
      counterpartyId: '',
      amount: 0,
      transferDate: new Date(),
      narration: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { errors },
  } = methods;

  React.useEffect(() => {
    if (isOpen) {
      if (initialData && selectedAccountId) {
        const isFrom = initialData.fromPaymentAccountId === selectedAccountId;
        reset({
          direction: isFrom ? 'FROM' : 'TO',
          counterpartyId: isFrom
            ? initialData.toPaymentAccountId
            : initialData.fromPaymentAccountId,
          amount: initialData.amount / 100,
          transferDate: new Date(initialData.transferDate),
          narration: initialData.narration || '',
        });
      } else {
        reset({
          direction: 'TO',
          counterpartyId: '',
          amount: 0,
          transferDate: new Date(),
          narration: '',
        });
      }
    }
  }, [isOpen, reset, initialData, selectedAccountId]);

  const direction = useWatch({ control: methods.control, name: 'direction' });
  const counterpartyId = useWatch({ control: methods.control, name: 'counterpartyId' });
  const transferDate = useWatch({ control: methods.control, name: 'transferDate' });
  const amount = useWatch({ control: methods.control, name: 'amount' });

  const actualSourceId = direction === 'FROM' ? selectedAccountId : counterpartyId;
  const actualDestId = direction === 'FROM' ? counterpartyId : selectedAccountId;

  const fetchAccountBalance = async (accountId: string) => {
    try {
      const summary = await window.vyora.reports.getAccountBalanceSummary(new Date());
      const accountSummary = summary.accounts.find((a) => a.accountId === accountId);
      if (accountSummary) {
        return {
          amount: accountSummary.closingBalance.amount,
          type: (accountSummary.closingBalance.type === 'CR' ? 'Cr' : 'Dr') as 'Dr' | 'Cr',
          name: accountSummary.accountName,
        };
      }
    } catch (err) {
      console.error('Failed to fetch account balance summary', err);
    }
    return null;
  };

  const handleClose = () => {
    setSuccessData(null);
    onClose();
  };

  React.useEffect(() => {
    let mounted = true;
    async function loadBalances() {
      if (!actualSourceId && !actualDestId) {
        if (mounted) {
          setSourceBalance(null);
          setDestBalance(null);
        }
        return;
      }

      try {
        if (mounted) setIsFetchingBalances(true);

        // Use Account Balance Summary as the single source of truth
        const summary = await window.vyora.reports.getAccountBalanceSummary(new Date());

        const getBal = (accId: string) => {
          const acc = summary.accounts.find((a) => a.accountId === accId);
          if (acc) {
            return {
              amount: acc.closingBalance.amount,
              type: acc.closingBalance.type === 'CR' ? 'Cr' : 'Dr',
            };
          }
          return null;
        };

        const src = actualSourceId ? getBal(actualSourceId) : null;
        const dest = actualDestId ? getBal(actualDestId) : null;

        if (mounted) {
          setSourceBalance(src ? { amount: src.amount, type: src.type as 'Dr' | 'Cr' } : null);
          setDestBalance(dest ? { amount: dest.amount, type: dest.type as 'Dr' | 'Cr' } : null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsFetchingBalances(false);
      }
    }

    if (isOpen && !successData) {
      loadBalances();
    }

    return () => {
      mounted = false;
    };
  }, [actualSourceId, actualDestId, isOpen, successData]);

  const srcNetRs = sourceBalance
    ? sourceBalance.type === 'Dr'
      ? sourceBalance.amount / 100
      : -(sourceBalance.amount / 100)
    : 0;
  const availableRs = Math.max(0, srcNetRs);
  const isInsufficient = amount > availableRs;

  const isValid =
    !!actualSourceId &&
    !!actualDestId &&
    actualSourceId !== actualDestId &&
    !isFetchingBalances &&
    amount > 0 &&
    !isInsufficient &&
    !!transferDate;

  const onSubmit = async (data: TransferFormPayload) => {
    if (!actualSourceId || !actualDestId) return;

    setIsSubmitting(true);
    try {
      const amountPaise = Math.round(data.amount * 100);

      const payload = {
        fromPaymentAccountId: actualSourceId,
        toPaymentAccountId: actualDestId,
        amount: amountPaise,
        transferDate: data.transferDate,
        narration: data.narration,
      };

      const res = isEdit
        ? await window.vyora.journal.updateTransfer({
            voucherId: initialData.voucherId,
            ...payload,
          })
        : await window.vyora.journal.postTransfer(payload);

      if (res.success && res.data) {
        // Fetch voucher for reference number and updated balances
        const voucherRes = await window.vyora.accounting.getVoucherById(res.data.voucherId);
        const [srcBal, destBal] = await Promise.all([
          fetchAccountBalance(actualSourceId),
          fetchAccountBalance(actualDestId),
        ]);

        if (voucherRes.success && voucherRes.data && srcBal && destBal) {
          setSuccessData({
            amount: data.amount,
            voucherNumber: voucherRes.data.voucherNumber,
            transferDate: data.transferDate,
            sourceName: srcBal.name,
            destName: destBal.name,
            sourceBalance: { amount: srcBal.amount, type: srcBal.type },
            destBalance: { amount: destBal.amount, type: destBal.type },
          });
        } else {
          // If subsequent fetches fail, we still consider the transfer posted!
          toast.success(`Transfer posted successfully but could not load updated balances.`);
          onSuccess();
          handleClose();
        }
      } else {
        const errorMsg =
          'error' in res && typeof res.error === 'string'
            ? res.error
            : `Failed to ${isEdit ? 'update' : 'post'} transfer.`;
        toast.error(errorMsg);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountCard = (
    title: string,
    isSource: boolean,
    balanceObj: { amount: number; type: 'Dr' | 'Cr' } | null,
    isStatic: boolean,
  ) => {
    const isFetching = isFetchingBalances;
    const netRs = balanceObj
      ? balanceObj.type === 'Dr'
        ? balanceObj.amount / 100
        : -(balanceObj.amount / 100)
      : 0;
    const available = Math.max(0, netRs);

    return (
      <div className="border-border bg-card min-w-0 flex-1 space-y-4 rounded-md border p-4 shadow-sm">
        <div className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {title}
        </div>

        {isStatic ? (
          <div className="border-input bg-muted flex h-10 w-full items-center overflow-hidden rounded-md border px-3 py-2 text-sm font-medium text-ellipsis whitespace-nowrap">
            {selectedAccountName}
          </div>
        ) : (
          <PaymentAccountSelector name="counterpartyId" />
        )}

        <div className="space-y-3 pt-2">
          <div className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-xs font-medium">Current Balance</span>
            {isFetching ? (
              <span className="bg-muted inline-block h-5 w-20 animate-pulse rounded text-sm font-medium" />
            ) : balanceObj ? (
              renderBalance(balanceObj.amount, balanceObj.type, 'text-sm font-medium')
            ) : (
              <span className="text-muted-foreground text-sm font-medium">-</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-xs font-medium">
              {isSource ? 'Available to transfer' : 'Available Balance'}
            </span>
            {isFetching ? (
              <span className="bg-muted inline-block h-5 w-20 animate-pulse rounded text-sm font-medium" />
            ) : balanceObj ? (
              renderBalance(available * 100, available > 0 ? 'Dr' : 'Dr', 'text-sm font-medium')
            ) : (
              <span className="text-muted-foreground text-sm font-medium">-</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (successData) {
    return (
      <AppModal
        isOpen={isOpen}
        onClose={() => {}} // Disabled close on overlay
        title=""
        hideActions
        className="pt-0"
      >
        <div className="flex flex-col items-center justify-center space-y-6 pt-2 pb-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="flex w-full flex-col items-center">
            <h2 className="text-foreground text-xl font-semibold">Transfer Successful</h2>
            <div className="mt-3 flex flex-col items-center">
              <span className="text-5xl font-bold tracking-tight text-emerald-600">
                ₹{successData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-emerald-600/50"></div>
                <span className="text-base font-medium text-emerald-600">
                  transferred successfully.
                </span>
                <div className="h-px w-8 bg-emerald-600/50"></div>
              </div>
            </div>
          </div>

          <div className="bg-card w-full overflow-hidden rounded-lg border text-left shadow-sm">
            <div className="bg-muted/30 flex items-center justify-between border-b p-4">
              <span className="max-w-[40%] truncate font-medium">{successData.sourceName}</span>
              <ArrowRight className="text-muted-foreground mx-2 h-4 w-4 flex-shrink-0" />
              <span className="max-w-[40%] truncate text-right font-medium">
                {successData.destName}
              </span>
            </div>
            <div className="flex p-4">
              <div className="flex-1 space-y-1 border-r pr-4">
                <div className="text-muted-foreground text-xs">Updated Balance</div>
                <div className="text-lg font-medium">
                  {renderBalance(successData.sourceBalance.amount, successData.sourceBalance.type)}
                </div>
              </div>
              <div className="flex-1 space-y-1 pl-4 text-right">
                <div className="text-muted-foreground text-xs">Updated Balance</div>
                <div className="text-lg font-medium">
                  {renderBalance(successData.destBalance.amount, successData.destBalance.type)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border-border/50 grid w-full gap-2 rounded-md border p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-medium">{successData.voucherNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {successData.transferDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <AppButton
            className="mt-2 w-full"
            size="lg"
            onClick={() => {
              onSuccess();
              handleClose();
            }}
          >
            Done
          </AppButton>
        </div>
      </AppModal>
    );
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Transfer' : 'Transfer Funds'}
      description={
        isEdit ? 'Modify your previous transfer details.' : 'Move money between your accounts.'
      }
      hideActions
      modalClassName="max-w-3xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {sourceBalance !== null && amount > 0 && sourceBalance.type === 'Cr' && (
            <input type="hidden" name="forceValidation" value="dummy" />
          )}

          <div className="space-y-2">
            <label className="text-sm leading-none font-medium">Transfer Direction</label>
            <FormSelect
              name="direction"
              options={[
                { value: 'TO', label: `Transfer To` },
                { value: 'FROM', label: `Transfer From` },
              ]}
            />
          </div>

          <div className="flex items-start gap-4">
            {renderAccountCard('Source Account', true, sourceBalance, direction === 'FROM')}

            <div className="flex flex-shrink-0 items-center justify-center pt-8">
              <div className="bg-muted rounded-full border p-2 shadow-sm">
                <ArrowRight className="text-muted-foreground h-4 w-4" />
              </div>
            </div>

            {renderAccountCard('Destination Account', false, destBalance, direction === 'TO')}
          </div>

          {errors.counterpartyId && (
            <p className="text-destructive text-sm font-medium">{errors.counterpartyId.message}</p>
          )}

          {isInsufficient && amount > 0 && (
            <div className="border-destructive/20 bg-destructive/10 rounded-md border p-4">
              <div className="text-destructive flex flex-col space-y-1 text-sm font-medium">
                <div className="flex items-center">
                  <span className="mr-2">⚠</span>
                  <span className="font-semibold">Insufficient balance</span>
                </div>
                <span className="text-muted-foreground pl-6">
                  You cannot transfer ₹
                  {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from this account.
                  <br />
                  Available to transfer: ₹
                  {availableRs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">Amount</label>
              <AppInput
                type="number"
                step="0.01"
                min="0.01"
                {...methods.register('amount', { valueAsNumber: true })}
              />
            </div>
            <AppDatePicker
              label="Date"
              value={transferDate ? transferDate.toISOString().split('T')[0] : ''}
              onChange={(d) => methods.setValue('transferDate', new Date(d))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm leading-none font-medium">Narration (Optional)</label>
            <AppInput {...methods.register('narration')} />
          </div>

          <div className="border-border/50 flex flex-col-reverse border-t pt-2 sm:flex-row sm:justify-end sm:space-x-2">
            <AppButton
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">◌</span> Processing...
                </span>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Transfer Funds'
              )}
            </AppButton>
          </div>
        </form>
      </FormProvider>
    </AppModal>
  );
}
