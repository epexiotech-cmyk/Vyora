'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSettlementInput } from '@vyora/types';
import { paiseToMoney, moneyToPaise, formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { PurchaseSupplierSelector } from '@/app/dashboard/(workspace)/purchases/_components/PurchaseSupplierSelector';
import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import { SalesCustomerSelector } from '@/components/forms/SalesCustomerSelector';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';

const settlementFormSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  paymentAccountId: z.string().min(1, 'Payment account is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  partyId: z.string().min(1, 'Party is required'),
  referenceNumber: z.string().optional().nullable(),
  referenceDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type SettlementFormValues = z.infer<typeof settlementFormSchema>;

interface OutstandingDocument {
  id: string;
  documentNumber: string;
  documentDate: Date;
  grandTotal: number;
  balanceDue: number;
  allocatedAmount: number;
  isSelected?: boolean;
}

interface RecordSettlementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PAYMENT' | 'RECEIPT';
  onSuccess?: () => void;
  editId?: string;
  defaultPartyId?: string;
  defaultAllocationId?: string;
  defaultAmount?: number; // In paise
}

export function RecordSettlementDialog({
  isOpen,
  onClose,
  type,
  onSuccess,
  editId,
  defaultPartyId,
  defaultAllocationId,
  defaultAmount,
}: RecordSettlementDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [outstandingDocs, setOutstandingDocs] = React.useState<OutstandingDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(false);

  const [initialAllocations, setInitialAllocations] = React.useState<
    import('@vyora/types').SettlementAllocationDto[]
  >([]);
  const [isLoadingExisting, setIsLoadingExisting] = React.useState(false);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM'>(
    'ALL',
  );
  const [dateCustomStart, setDateCustomStart] = React.useState('');
  const [dateCustomEnd, setDateCustomEnd] = React.useState('');
  const [balanceFilter, setBalanceFilter] = React.useState<'ALL' | 'PARTIAL' | 'FULL'>('ALL');
  const [sortOption, setSortOption] = React.useState<
    | 'DATE_DESC'
    | 'DATE_ASC'
    | 'DOC_ASC'
    | 'DOC_DESC'
    | 'AMOUNT_DESC'
    | 'AMOUNT_ASC'
    | 'BALANCE_DESC'
    | 'BALANCE_ASC'
  >('DATE_DESC');

  const defaultValues: SettlementFormValues = React.useMemo(
    () => ({
      amount: defaultAmount ? paiseToMoney(defaultAmount) : 0,
      paymentAccountId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      partyId: defaultPartyId || '',
      referenceNumber: '',
      referenceDate: '',
      notes: '',
    }),
    [defaultPartyId, defaultAmount],
  );

  const methods = useForm<SettlementFormValues>({
    // @ts-expect-error zod coerce makes the input type unknown which conflicts with useForm
    resolver: zodResolver(settlementFormSchema),
    defaultValues,
  });

  const watchPartyId = useWatch({ control: methods.control, name: 'partyId' });
  const watchAmountRaw = useWatch({ control: methods.control, name: 'amount' });
  const watchAmount = Number(watchAmountRaw || 0);
  const watchAmountPaise = moneyToPaise(watchAmount);

  const totalAllocatedPaise = React.useMemo(() => {
    return outstandingDocs.reduce((sum, doc) => sum + (doc.allocatedAmount || 0), 0);
  }, [outstandingDocs]);

  React.useEffect(() => {
    if (isOpen && !editId) {
      methods.reset(defaultValues);
      queueMicrotask(() => {
        setOutstandingDocs([]);
        setInitialAllocations([]);
        setErrorMsg(null);
        setSearchQuery('');
        setDateFilter('ALL');
        setBalanceFilter('ALL');
        setSortOption('DATE_DESC');
      });
    }
  }, [isOpen, editId, methods, defaultValues]);

  React.useEffect(() => {
    if (isOpen && editId) {
      let ignore = false;
      const fetchEditData = async () => {
        setIsLoadingExisting(true);
        try {
          const res = await window.vyora.accounting.getSettlementById(editId);
          if (!ignore && res.success && res.data) {
            const data = res.data;
            if (data.status === 'CANCELLED') {
              setErrorMsg('Cannot edit a CANCELLED settlement');
              setIsLoadingExisting(false);
              return;
            }

            // Resolve paymentAccountId from bankLedgerId
            let resolvedPaymentAccountId = '';
            try {
              const accounts = await window.vyora.paymentAccounts.search({ isActive: true });
              const matched = accounts.find((a) => a.ledgerId === data.bankLedgerId);
              if (matched) {
                resolvedPaymentAccountId = matched.id;
              }
            } catch (err) {
              console.error('Failed to resolve payment account for edit', err);
            }

            setInitialAllocations(data.allocations || []);

            methods.reset({
              amount: paiseToMoney(data.amount),
              paymentAccountId: resolvedPaymentAccountId,
              paymentDate: new Date(data.settlementDate).toISOString().split('T')[0],
              partyId: data.partyId,
              referenceNumber: data.referenceNumber || '',
              referenceDate: data.referenceDate
                ? new Date(data.referenceDate).toISOString().split('T')[0]
                : '',
              notes: data.notes || '',
            });
          }
        } catch (e) {
          console.error(e);
          if (!ignore) setErrorMsg('Failed to load settlement details');
        } finally {
          if (!ignore) setIsLoadingExisting(false);
        }
      };
      fetchEditData();
      return () => {
        ignore = true;
      };
    }
  }, [isOpen, editId, methods]);

  React.useEffect(() => {
    if (!watchPartyId) {
      queueMicrotask(() => {
        setOutstandingDocs([]);
        setSearchQuery('');
        setDateFilter('ALL');
        setBalanceFilter('ALL');
        setSortOption('DATE_DESC');
      });
      return;
    }

    let ignore = false;
    const fetchOutstanding = async () => {
      setIsLoadingDocs(true);
      try {
        let docs: import('@vyora/types').OutstandingDocumentDto[] = [];
        if (type === 'PAYMENT') {
          const res = await window.vyora.accounting.getOutstandingForSupplier(watchPartyId);
          if (res.success && res.data) {
            docs = res.data;
          }
        } else {
          const res = await window.vyora.accounting.getOutstandingForCustomer(watchPartyId);
          if (res.success && res.data) {
            docs = res.data;
          }
        }

        if (!ignore) {
          const mappedDocs = docs.map((d) => {
            const initialAlloc = initialAllocations.find((a) => a.documentId === d.id);
            const isDefault = !editId && defaultAllocationId === d.id;
            return {
              id: d.id,
              documentNumber: d.documentNumber,
              documentDate: new Date(d.documentDate),
              grandTotal: d.grandTotal,
              balanceDue: d.balanceDue, 
              allocatedAmount: initialAlloc ? initialAlloc.allocatedAmount : (isDefault ? Math.min(defaultAmount || d.balanceDue, d.balanceDue) : 0),
              isSelected: !!initialAlloc || isDefault,
            };
          });

          // Ensure documents from initialAllocations that were fully paid (and thus not in docs) are included
          if (initialAllocations.length > 0) {
            for (const alloc of initialAllocations) {
              if (!mappedDocs.find((md) => md.id === alloc.documentId)) {
                mappedDocs.push({
                  id: alloc.documentId,
                  documentNumber: alloc.documentNumber || 'Unknown',
                  documentDate: alloc.documentDate ? new Date(alloc.documentDate) : new Date(),
                  grandTotal: alloc.documentTotal || 0,
                  balanceDue: alloc.documentBalance || alloc.allocatedAmount, // Use the restored balance from Phase 2
                  allocatedAmount: alloc.allocatedAmount,
                  isSelected: true,
                });
              } else {
                // If it IS in mappedDocs, we need to override the balanceDue with the restored documentBalance from the DTO
                const existing = mappedDocs.find((md) => md.id === alloc.documentId);
                if (existing) {
                  existing.balanceDue = alloc.documentBalance || existing.balanceDue;
                }
              }
            }
          }

          setOutstandingDocs(mappedDocs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setIsLoadingDocs(false);
      }
    };
    fetchOutstanding();
    return () => {
      ignore = true;
    };
  }, [watchPartyId, type, initialAllocations, defaultAllocationId, defaultAmount, editId]);

  const totalPendingPaise = React.useMemo(() => {
    return outstandingDocs.reduce((sum, doc) => sum + doc.balanceDue, 0);
  }, [outstandingDocs]);

  const amountRemainingPaise = watchAmountPaise - totalAllocatedPaise;

  const visibleDocs = React.useMemo(() => {
    let filtered = [...outstandingDocs];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((doc) => doc.documentNumber.toLowerCase().includes(query));
    }

    // Date Filter
    if (dateFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'TODAY') {
        filtered = filtered.filter((doc) => {
          const d = new Date(doc.documentDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      } else if (dateFilter === 'THIS_MONTH') {
        filtered = filtered.filter((doc) => {
          const d = new Date(doc.documentDate);
          return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        });
      } else if (dateFilter === 'CUSTOM' && dateCustomStart && dateCustomEnd) {
        const start = new Date(dateCustomStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateCustomEnd);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((doc) => {
          const d = new Date(doc.documentDate);
          return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
        });
      }
    }

    // Balance Filter
    if (balanceFilter !== 'ALL') {
      filtered = filtered.filter((doc) => {
        if (balanceFilter === 'PARTIAL') return doc.balanceDue < doc.grandTotal;
        if (balanceFilter === 'FULL') return doc.balanceDue === doc.grandTotal;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'DATE_DESC':
          return b.documentDate.getTime() - a.documentDate.getTime();
        case 'DATE_ASC':
          return a.documentDate.getTime() - b.documentDate.getTime();
        case 'DOC_ASC':
          return a.documentNumber.localeCompare(b.documentNumber);
        case 'DOC_DESC':
          return b.documentNumber.localeCompare(a.documentNumber);
        case 'AMOUNT_DESC':
          return b.grandTotal - a.grandTotal;
        case 'AMOUNT_ASC':
          return a.grandTotal - b.grandTotal;
        case 'BALANCE_DESC':
          return b.balanceDue - a.balanceDue;
        case 'BALANCE_ASC':
          return a.balanceDue - b.balanceDue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    outstandingDocs,
    searchQuery,
    dateFilter,
    dateCustomStart,
    dateCustomEnd,
    balanceFilter,
    sortOption,
  ]);

  const handleSelectDocument = (id: string, checked: boolean) => {
    setOutstandingDocs((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          if (checked) {
            const maxAmountPaise = doc.balanceDue;
            const toAllocatePaise = Math.min(maxAmountPaise, amountRemainingPaise);
            return { ...doc, isSelected: true, allocatedAmount: Math.max(0, toAllocatePaise) };
          } else {
            return { ...doc, isSelected: false, allocatedAmount: 0 };
          }
        }
        return doc;
      }),
    );
  };

  const handleSelectAll = () => {
    setOutstandingDocs((prev) => {
      const hiddenAllocatedPaise = prev
        .filter((doc) => !visibleDocs.some((vd) => vd.id === doc.id))
        .reduce((sum, doc) => sum + (doc.allocatedAmount || 0), 0);

      let currentRemainingPaise = watchAmountPaise - hiddenAllocatedPaise;

      const visibleAllocations = new Map<
        string,
        { isSelected: boolean; allocatedAmount: number }
      >();

      for (const vdoc of visibleDocs) {
        if (currentRemainingPaise <= 0) {
          visibleAllocations.set(vdoc.id, { isSelected: false, allocatedAmount: 0 });
        } else {
          const maxAmountPaise = vdoc.balanceDue;
          const toAllocatePaise = Math.min(maxAmountPaise, currentRemainingPaise);
          currentRemainingPaise -= toAllocatePaise;
          visibleAllocations.set(vdoc.id, { isSelected: true, allocatedAmount: toAllocatePaise });
        }
      }

      return prev.map((doc) => {
        if (visibleAllocations.has(doc.id)) {
          return { ...doc, ...visibleAllocations.get(doc.id) };
        }
        return doc;
      });
    });
  };

  const handleClearAll = () => {
    setOutstandingDocs((prev) =>
      prev.map((doc) => {
        const isVisible = visibleDocs.some((vd) => vd.id === doc.id);
        if (isVisible) {
          return { ...doc, isSelected: false, allocatedAmount: 0 };
        }
        return doc;
      }),
    );
  };

  const handleAllocationChange = (id: string, amountRupees: number) => {
    setOutstandingDocs((prev) => {
      const currentOtherAllocatedPaise = prev
        .filter((d) => d.id !== id)
        .reduce((sum, d) => sum + (d.allocatedAmount || 0), 0);
      const currentRemainingPaise = watchAmountPaise - currentOtherAllocatedPaise;

      return prev.map((doc) => {
        if (doc.id === id) {
          const maxAmountPaise = doc.balanceDue;
          let newAmountPaise = moneyToPaise(amountRupees || 0);
          if (newAmountPaise > maxAmountPaise) newAmountPaise = maxAmountPaise;
          if (newAmountPaise > currentRemainingPaise)
            newAmountPaise = currentRemainingPaise > 0 ? currentRemainingPaise : 0;
          if (newAmountPaise < 0) newAmountPaise = 0;
          return {
            ...doc,
            allocatedAmount: newAmountPaise,
            isSelected: newAmountPaise > 0 || doc.isSelected,
          };
        }
        return doc;
      });
    });
  };

  const handleClose = () => {
    setErrorMsg(null);
    onClose();
  };

  const onSubmit = async (data: SettlementFormValues) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const safeAmount = Number(data.amount || 0);
      const amountInPaise = moneyToPaise(safeAmount);

      if (amountInPaise <= 0) {
        setErrorMsg('Payment amount must be greater than zero');
        return;
      }

      if (totalAllocatedPaise !== amountInPaise) {
        setErrorMsg(
          `Total allocated amount (${formatMoney(totalAllocatedPaise)}) must exactly equal settlement amount (${formatMoney(amountInPaise)})`,
        );
        return;
      }

      const allocations = outstandingDocs
        .filter((d) => (d.allocatedAmount || 0) > 0)
        .map((d) => ({
          documentType: type === 'PAYMENT' ? 'PURCHASE_BILL' : 'SALES_INVOICE',
          documentId: d.id,
          allocatedAmount: d.allocatedAmount,
        })) as CreateSettlementInput['allocations'];

      if (allocations.length === 0) {
        setErrorMsg('You must allocate the payment to at least one outstanding document.');
        return;
      }

      // Fetch the selected payment account to determine its type for paymentMode
      let paymentMode: 'CASH' | 'BANK' | 'UPI' | 'POS' = 'CASH';
      if (data.paymentAccountId) {
        const account = await window.vyora.paymentAccounts.getById(data.paymentAccountId);
        if (account) {
          paymentMode = account.accountType;
        } else {
          throw new Error('Failed to resolve payment account details');
        }
      }

      if (editId) {
        const updatePayload: import('@vyora/types').UpdateSettlementInput = {
          settlementId: editId,
          settlementDate: new Date(data.paymentDate),
          amount: amountInPaise,
          paymentAccountId: data.paymentAccountId,
          referenceNumber: data.referenceNumber || undefined,
          referenceDate: data.referenceDate ? new Date(data.referenceDate) : undefined,
          notes: data.notes || undefined,
          allocations: allocations as import('@vyora/types').UpdateSettlementInput['allocations'],
        };

        const res = await window.vyora.accounting.editSettlement(editId, updatePayload);
        if (res && res.success) {
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(res?.error || `Failed to update ${type.toLowerCase()}`);
        }
      } else {
        const payload: CreateSettlementInput = {
          amount: amountInPaise,
          settlementDate: new Date(data.paymentDate),
          paymentMode,
          paymentAccountId: data.paymentAccountId,
          partyType: type === 'PAYMENT' ? 'SUPPLIER' : 'CUSTOMER',
          partyId: data.partyId,
          referenceNumber: data.referenceNumber || undefined,
          referenceDate: data.referenceDate ? new Date(data.referenceDate) : undefined,
          notes: data.notes || undefined,
          allocations,
        };

        const res = await window.vyora.accounting.createSettlement(payload);

        if (res && res.success) {
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(res?.error || `Failed to record ${type.toLowerCase()}`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        editId
          ? type === 'PAYMENT'
            ? 'Edit Payment'
            : 'Edit Receipt'
          : type === 'PAYMENT'
            ? 'Record Payment'
            : 'Record Receipt'
      }
      hideActions
      modalClassName="max-w-4xl"
    >
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
          {errorMsg}
        </div>
      )}
      {isLoadingExisting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-[1px]">
          <span className="text-sm font-medium text-gray-500">Loading existing settlement...</span>
        </div>
      )}
      
      {!isLoadingDocs && defaultAllocationId && outstandingDocs.length > 0 && (
        <div className="bg-muted/30 mb-6 rounded-md p-4 text-sm border border-border/50">
          <h4 className="font-semibold mb-2 text-foreground/80">
            {type === 'PAYMENT' ? 'Purchase Context' : 'Sales Context'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground block mb-1">Document Amount</span>
              <span className="font-medium">
                {formatMoney(outstandingDocs.find(d => d.id === defaultAllocationId)?.grandTotal || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Document Balance</span>
              <span className="font-medium">
                {formatMoney(outstandingDocs.find(d => d.id === defaultAllocationId)?.balanceDue || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                {type === 'PAYMENT' ? 'Supplier Outstanding' : 'Customer Outstanding'}
              </span>
              <span className="font-medium">
                {formatMoney(totalPendingPaise)}
              </span>
            </div>
          </div>
        </div>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((data) => onSubmit(data as unknown as SettlementFormValues))} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AppField name="partyId" label={type === 'PAYMENT' ? 'Supplier *' : 'Customer *'}>
              {type === 'PAYMENT' ? (
                <PurchaseSupplierSelector name="partyId" disabled={isSubmitting || !!defaultPartyId} />
              ) : (
                <SalesCustomerSelector name="partyId" disabled={isSubmitting || !!defaultPartyId} />
              )}
            </AppField>

            <AppField name="paymentDate" label="Date *">
              <FormInput name="paymentDate" type="date" disabled={isSubmitting} />
            </AppField>

            <AppField name="paymentAccountId" label="Payment Account *">
              <PaymentAccountSelector name="paymentAccountId" disabled={isSubmitting} />
            </AppField>

            <AppField name="amount" label="Total Amount *">
              <FormInput
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                valueAsNumber={true}
                disabled={isSubmitting}
              />
              {watchPartyId && watchAmountPaise > totalPendingPaise && (
                <div className="mt-2 text-xs text-amber-600">
                  Settlement exceeds total outstanding by{' '}
                  {formatMoney(watchAmountPaise - totalPendingPaise)}. Advance payments are not
                  currently supported.
                </div>
              )}
            </AppField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AppField name="referenceNumber" label="Reference Number (e.g. UTR / Cheque)">
              <FormInput name="referenceNumber" type="text" disabled={isSubmitting} />
            </AppField>

            <AppField name="referenceDate" label="Reference Date">
              <FormInput name="referenceDate" type="date" disabled={isSubmitting} />
            </AppField>
          </div>

          <AppField name="notes" label="Notes">
            <textarea
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Add ${type.toLowerCase()} notes...`}
              disabled={isSubmitting}
              {...methods.register('notes')}
            />
          </AppField>

          {/* Allocation Section */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-semibold text-gray-700">Outstanding Documents</h3>
                {outstandingDocs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                      disabled={isSubmitting || amountRemainingPaise <= 0}
                    >
                      Select All Visible
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                      disabled={isSubmitting}
                    >
                      Clear All Visible
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Total Settlement:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatMoney(watchAmountPaise)}
                  </span>
                </span>
                <span className="text-gray-500">
                  Total Pending:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatMoney(totalPendingPaise)}
                  </span>
                </span>
                <span className="text-gray-500">
                  Allocated:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatMoney(totalAllocatedPaise)}
                  </span>
                </span>
                <span
                  className={`font-semibold ${amountRemainingPaise === 0 ? 'text-green-600' : amountRemainingPaise < 0 ? 'text-red-600' : 'text-blue-600'}`}
                >
                  Remaining: {formatMoney(amountRemainingPaise)}
                </span>
              </div>
            </div>

            {/* Toolbar */}
            {outstandingDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white p-3">
                <div className="min-w-[200px] flex-1">
                  <input
                    type="text"
                    placeholder="Search by Document No..."
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none"
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value as 'ALL' | 'PARTIAL' | 'FULL')}
                >
                  <option value="ALL">All Balances</option>
                  <option value="PARTIAL">Partially Outstanding</option>
                  <option value="FULL">Fully Outstanding</option>
                </select>

                <select
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(e.target.value as 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM')
                  }
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="CUSTOM">Custom Range</option>
                </select>

                {dateFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm outline-none"
                      value={dateCustomStart}
                      onChange={(e) => setDateCustomStart(e.target.value)}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm outline-none"
                      value={dateCustomEnd}
                      onChange={(e) => setDateCustomEnd(e.target.value)}
                    />
                  </div>
                )}

                <select
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none"
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as
                        | 'DATE_DESC'
                        | 'DATE_ASC'
                        | 'DOC_ASC'
                        | 'DOC_DESC'
                        | 'AMOUNT_DESC'
                        | 'AMOUNT_ASC'
                        | 'BALANCE_DESC'
                        | 'BALANCE_ASC',
                    )
                  }
                >
                  <option value="DATE_DESC">Date: Newest First</option>
                  <option value="DATE_ASC">Date: Oldest First</option>
                  <option value="DOC_ASC">Doc No: A-Z</option>
                  <option value="DOC_DESC">Doc No: Z-A</option>
                  <option value="AMOUNT_DESC">Amount: Highest First</option>
                  <option value="AMOUNT_ASC">Amount: Lowest First</option>
                  <option value="BALANCE_DESC">Balance: Highest First</option>
                  <option value="BALANCE_ASC">Balance: Lowest First</option>
                </select>
              </div>
            )}

            <div className="max-h-60 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="w-12 px-4 py-3 font-medium"></th>
                    <th className="px-4 py-3 font-medium">Document No</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Total Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Balance Due</th>
                    <th className="w-48 px-4 py-3 text-right font-medium">Allocate Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!watchPartyId && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Please select a {type === 'PAYMENT' ? 'supplier' : 'customer'} to view
                        outstanding documents.
                      </td>
                    </tr>
                  )}
                  {watchPartyId && isLoadingDocs && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Loading outstanding documents...
                      </td>
                    </tr>
                  )}
                  {watchPartyId && !isLoadingDocs && outstandingDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No outstanding documents found.
                      </td>
                    </tr>
                  )}
                  {watchPartyId &&
                    !isLoadingDocs &&
                    outstandingDocs.length > 0 &&
                    visibleDocs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No outstanding documents match the current search/filter.
                        </td>
                      </tr>
                    )}
                  {watchPartyId &&
                    !isLoadingDocs &&
                    visibleDocs.map((doc) => {
                      const maxAmountPaise = doc.balanceDue;
                      const isFullyAllocated = doc.allocatedAmount === maxAmountPaise;
                      const isPartiallyAllocated =
                        doc.allocatedAmount > 0 && doc.allocatedAmount < maxAmountPaise;
                      const isDisabled = !doc.isSelected && amountRemainingPaise <= 0;

                      return (
                        <tr
                          key={doc.id}
                          className={`transition-colors hover:bg-gray-50 ${doc.isSelected ? 'bg-indigo-50/30' : ''}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={doc.isSelected || false}
                              disabled={isSubmitting || isDisabled}
                              onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {doc.documentNumber}
                            {doc.isSelected && isFullyAllocated && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Fully Allocated
                              </span>
                            )}
                            {doc.isSelected && isPartiallyAllocated && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                Partial
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {doc.documentDate.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {formatMoney(doc.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatMoney(doc.balanceDue)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="relative flex flex-col items-end gap-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                max={paiseToMoney(maxAmountPaise)}
                                value={
                                  doc.allocatedAmount === 0 ? '' : paiseToMoney(doc.allocatedAmount)
                                }
                                onChange={(e) =>
                                  handleAllocationChange(doc.id, parseFloat(e.target.value) || 0)
                                }
                                className={`w-full rounded border px-2 py-1 text-right transition-colors outline-none ${
                                  doc.isSelected
                                    ? 'border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                    : 'border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20'
                                }`}
                                disabled={isSubmitting || isDisabled}
                                placeholder="0.00"
                              />
                              {doc.isSelected &&
                                isPartiallyAllocated &&
                                maxAmountPaise > amountRemainingPaise &&
                                doc.allocatedAmount > 0 && (
                                  <div className="mt-1 max-w-xs text-right text-[10px] leading-tight text-amber-700">
                                    This bill has {formatMoney(doc.balanceDue)} pending, but only{' '}
                                    {formatMoney(doc.allocatedAmount)} was available in this
                                    settlement. It has been allocated as a partial payment.
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {amountRemainingPaise === 0 && outstandingDocs.some((d) => d.allocatedAmount > 0) && (
                <div className="border-t border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                  ✓ Settlement fully allocated
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <AppButton
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              disabled={
                isSubmitting || isLoadingExisting || amountRemainingPaise !== 0 || watchAmount <= 0
              }
            >
              {isSubmitting
                ? 'Saving...'
                : editId
                  ? type === 'PAYMENT'
                    ? 'Update Payment'
                    : 'Update Receipt'
                  : `Save ${type === 'PAYMENT' ? 'Payment' : 'Receipt'}`}
            </AppButton>
          </div>
        </form>
      </FormProvider>
    </AppModal>
  );
}
