'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePurchaseInput, PurchaseDto, InvoiceStatus } from '@vyora/types';
import { paiseToMoney } from '@vyora/utils';
import { Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PurchaseTotalsCard } from '../../purchases/_components/PurchaseTotalsCard';

import { ExpenseLineGrid } from './ExpenseLineGrid';
import { ExpensePayeeSelector } from './ExpensePayeeSelector';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { PaymentAccountSelector } from '@/components/forms/PaymentAccountSelector';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppInput } from '@/components/ui/AppInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  mapLinesToEngineInput,
  useAsyncInvoiceCalculation,
} from '@/lib/calculation/calculationAdapter';

const expenseUiSchema = z
  .object({
    paymentAccountId: z.string().nullable().optional(),
    supplierId: z.string().nullable().optional(),
    supplierName: z.string().min(1, 'Payee/Supplier Name is required'),
    isMiscellaneous: z.boolean().default(false),
    purchaseDate: z.string().min(1, 'Expense date is required'),
    supplierInvoiceNumber: z.string().optional().nullable(),
    supplierInvoiceDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    lines: z
      .array(
        z.object({
          expensePresetId: z.string().nullable(),
          description: z.string().optional().nullable(),
          taxId: z.string().optional(),
          quantity: z.number().min(1, 'Quantity must be at least 1'),
          rate: z.number().min(0, 'Rate cannot be negative'),
          discountAmount: z.number().min(0),
          taxableAmount: z.number().min(0),
          taxAmount: z.number().min(0),
          lineTotal: z.number().min(0),
          _uiTaxPercentage: z.number(),
        }),
      )
      .min(1, 'At least one line is required'),
  })
  .refine(
    (data) => {
      // Paid Now vs Pay Later logic
      if (!data.paymentAccountId && !data.supplierId && !data.isMiscellaneous) {
        return false;
      }
      return true;
    },
    {
      message: 'Must either select a Payment Account (Paid Now) or a Supplier (Pay Later)',
      path: ['paymentAccountId'],
    },
  );

type ExpenseUiValues = z.infer<typeof expenseUiSchema>;

interface ExpenseFormProps {
  isEditMode?: boolean;
  initialData?: PurchaseDto;
  forceReadOnly?: boolean;
}

export function ExpenseForm({ isEditMode, initialData, forceReadOnly }: ExpenseFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [activeCompanyId, setActiveCompanyId] = React.useState<string>('');
  const [activeFinancialYearId, setActiveFinancialYearId] = React.useState<string>('');

  const [pinPromptOpen, setPinPromptOpen] = React.useState(false);
  const [pinLength, setPinLength] = React.useState(4);
  const [pinArray, setPinArray] = React.useState<string[]>(Array(4).fill(''));
  const pinRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [pendingSubmitData, setPendingSubmitData] = React.useState<ExpenseUiValues | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      const res = await window.vyora.auth.getCurrentUser();
      if (res.success && res.data) {
        const currentUser = res.data as import('@vyora/types').UserDto;
        const len = currentUser.pinLength || 4;
        setPinLength(len);
        setPinArray(Array(len).fill(''));
      }
    }
    loadUser();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    const newPin = [...pinArray];
    newPin[index] = value;
    setPinArray(newPin);

    if (value !== '' && index < pinLength - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pinArray[index] === '' && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const currentPin = pinArray.join('');

  const defaultValues = initialData
    ? {
        paymentAccountId: initialData.paymentAccountId || null,
        supplierId: initialData.supplierId || null,
        supplierName: initialData.supplierName || '',
        isMiscellaneous: false,
        purchaseDate: new Date(initialData.purchaseDate).toISOString().split('T')[0],
        supplierInvoiceNumber: initialData.supplierInvoiceNumber || '',
        supplierInvoiceDate: initialData.supplierInvoiceDate
          ? new Date(initialData.supplierInvoiceDate).toISOString().split('T')[0]
          : '',
        notes: initialData.notes || '',
        lines: initialData.lines.map((line) => ({
          expensePresetId: line.expensePresetId || null,
          description: line.description || '',
          taxId: line.taxId || '',
          quantity: line.quantity,
          rate: paiseToMoney(line.rate),
          discountAmount: paiseToMoney(line.discountAmount),
          taxableAmount: paiseToMoney(line.taxableAmount),
          taxAmount: paiseToMoney(line.taxAmount),
          lineTotal: paiseToMoney(line.lineTotal),
          _uiTaxPercentage: 0,
        })),
      }
    : {
        paymentAccountId: null,
        supplierId: null,
        supplierName: 'Miscellaneous Expenses',
        isMiscellaneous: true,
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        supplierInvoiceDate: '',
        notes: '',
        lines: [
          {
            expensePresetId: null,
            description: '',
            taxId: '',
            quantity: 1,
            rate: 0,
            discountAmount: 0,
            taxableAmount: 0,
            taxAmount: 0,
            lineTotal: 0,
            _uiTaxPercentage: 0,
          },
        ],
      };

  const methods = useForm<ExpenseUiValues>({
    // @ts-expect-error - Zod boolean default typing mismatch with react-hook-form
    resolver: zodResolver(expenseUiSchema),
    defaultValues: defaultValues as import('react-hook-form').DefaultValues<ExpenseUiValues>,
  });

  // @ts-expect-error - react-hook-form strict typing mismatch for complex dynamic forms
  const calculationState = useAsyncInvoiceCalculation('purchase', methods.control);

  React.useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const companyRes = await window.vyora.company.getActive();
        if (companyRes.success && companyRes.data) {
          setActiveCompanyId(companyRes.data);
        }

        const fyRes = await window.vyora.financialYear.getCurrent();
        if (fyRes.success && fyRes.data) {
          setActiveFinancialYearId(fyRes.data.id);
        } else {
          setActiveFinancialYearId('33333333-3333-3333-3333-333333333333');
        }
      } catch (err) {
        console.error('Failed to load active contexts', err);
      }
    };
    fetchDependencies();
  }, []);

  const handleFormSubmit = (data: ExpenseUiValues) => {
    const currentStatus = initialData?.status || 'DRAFT';
    if (currentStatus === 'SUBMITTED') {
      setPendingSubmitData(data);
      setPinArray(Array(pinLength).fill(''));
      setPinPromptOpen(true);
    } else {
      onSubmit(data);
    }
  };

  const confirmSubmitWithPin = () => {
    if (pendingSubmitData && currentPin.length === pinLength) {
      setPinPromptOpen(false);
      onSubmit(pendingSubmitData, currentPin);
    }
  };

  const onSubmit = async (data: ExpenseUiValues, pin?: string) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!activeCompanyId) throw new Error('No active company found');

      // Filter out empty lines (where expensePresetId is null or empty)
      const validLines = (data.lines || []).filter((line) => !!line.expensePresetId);

      const engineInput = mapLinesToEngineInput(validLines, 'purchase');
      const calcResponse = await window.vyora.calculation.calculateInvoice(engineInput);

      if (
        !calcResponse ||
        !calcResponse.success ||
        !calcResponse.data ||
        calcResponse.data.items.length === 0
      ) {
        throw new Error('Please add at least one valid line item or check calculation engine.');
      }

      const computedTotals = calcResponse.data;

      const items = computedTotals.items.map((line, index) => {
        const uiLine = validLines[index];
        const engineIn = engineInput.items[index];
        return {
          expensePresetId: uiLine.expensePresetId!,
          itemName: 'Expense', // Will be populated in backend via preset resolver
          unitId: undefined, // Expenses do not have units
          taxId: uiLine.taxId || undefined,
          description: uiLine.description || undefined,
          quantity: engineIn.quantity,
          rate: engineIn.rate,
          discountAmount: engineIn.discountAmount,
          taxableAmount: line.taxableAmount,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
        };
      });

      const payload = {
        financialYearId: activeFinancialYearId,
        documentType: 'EXPENSE' as const,
        purchaseDate: new Date(data.purchaseDate),
        supplierId: data.supplierId || undefined,
        paymentAccountId: data.paymentAccountId || undefined,
        paymentDate: (data as Record<string, unknown>).paymentDate as Date,
        paymentMode: ((data as Record<string, unknown>).paymentMode as string) || 'CASH',
        supplierInvoiceNumber: data.supplierInvoiceNumber || undefined,
        supplierInvoiceDate: data.supplierInvoiceDate
          ? new Date(data.supplierInvoiceDate)
          : undefined,
        isReverseCharge: false,
        isMiscellaneous: data.isMiscellaneous,
        notes: data.notes || undefined,
        subtotal: computedTotals.subtotal,
        discountAmount: computedTotals.totalDiscount,
        taxAmount: computedTotals.totalTax,
        roundOffAmount: computedTotals.roundOffAmount,
        grandTotal: computedTotals.grandTotal,
        lines: items,
        status: 'DRAFT' as InvoiceStatus,
      } as Omit<CreatePurchaseInput, 'companyId'> & {
        status: InvoiceStatus;
        paymentDate?: Date;
        paymentMode?: string;
      };

      if (isEditMode && initialData) {
        // Edit mode
        const res = await window.vyora.db.purchases.update(
          {
            id: initialData.id,
            ...payload,
          },
          pin,
        );

        if (res.success) {
          setSuccessMsg(`Purchase updated successfully!`);
          // Stay on edit page
        } else {
          setErrorMsg(res.error || 'Failed to update purchase');
        }
      } else {
        // Create mode
        const res = await window.vyora.db.purchases.create({
          ...payload,
        });

        if (res.success) {
          setSuccessMsg(`Expense saved successfully!`);
          router.push(`/dashboard/expenses/edit?id=${res.data}`);
        } else {
          setErrorMsg(res.error || 'Failed to save expense');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message || 'An unexpected error occurred');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPurchase = async () => {
    if (!initialData?.id) return;
    if (
      !window.confirm(
        'Are you sure? This will post inventory and accounting entries and lock the purchase.',
      )
    )
      return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await window.vyora.db.purchases.submit(initialData.id);
      if (res.success) {
        toast.success('Expense recorded successfully!');
        setTimeout(() => router.push('/dashboard/expenses'), 150);
      } else {
        setErrorMsg(res.error || 'Failed to submit expense.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPurchase = async () => {
    if (!initialData?.id) return;
    if (!window.confirm('Are you sure? If submitted, ledger entries will be reversed.')) return;

    try {
      setIsCancelling(true);
      setErrorMsg(null);
      const res = await window.vyora.db.purchases.cancel(initialData.id);
      if (res.success) {
        setSuccessMsg('Expense cancelled successfully!');
        setTimeout(() => window.location.reload(), 150);
      } else {
        setErrorMsg(res.error || 'Failed to cancel expense.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while cancelling.');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStatus = initialData?.status || 'DRAFT';
  const isReadOnly = forceReadOnly || currentStatus === 'CANCELLED';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-2">
        {methods.formState.errors.root && (
          <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
            {methods.formState.errors.root.message}
          </div>
        )}
        {errorMsg && (
          <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            <span>{successMsg}</span>
          </div>
        )}

        {/* PIN Prompt Modal */}
        <AppModal
          isOpen={pinPromptOpen}
          onClose={() => setPinPromptOpen(false)}
          title="Authorization Required"
        >
          <div className="space-y-4 pt-4">
            <p className="text-destructive font-bold">
              WARNING: You are editing an already submitted expense. This will reverse and repost
              accounting entries. Please enter your PIN to authorize.
            </p>
            <div className="flex justify-center space-x-3">
              {pinArray.map((digit, index) => (
                <AppInput
                  key={index}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handlePinChange(index, e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    handlePinKeyDown(index, e)
                  }
                  ref={(el: HTMLInputElement | null) => {
                    pinRefs.current[index] = el;
                  }}
                  autoFocus={index === 0}
                  className="h-12 w-12 text-center text-lg font-bold"
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AppButton variant="outline" onClick={() => setPinPromptOpen(false)}>
                Cancel
              </AppButton>
              <AppButton onClick={confirmSubmitWithPin} disabled={currentPin.length !== pinLength}>
                Confirm Edit
              </AppButton>
            </div>
          </div>
        </AppModal>

        <div className="flex items-start justify-between">
          <SectionHeader
            title={isEditMode ? 'Edit Expense' : 'New Expense'}
            description="Manage expenses and payee details"
          />
          <div className="flex items-center gap-3">
            <StatusBadge
              data-testid="purchase-status-badge"
              variant={
                currentStatus === 'SUBMITTED'
                  ? 'success'
                  : currentStatus === 'DRAFT'
                    ? 'warning'
                    : 'destructive'
              }
            >
              {currentStatus}
            </StatusBadge>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form
          className="scrollbar-thumb-border flex-1 scrollbar-thin overflow-y-auto px-6 py-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <fieldset disabled={isSaving || isReadOnly} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Left Column: Main Content (8 cols on xl) */}
              <div className="flex flex-col gap-6 xl:col-span-8">
                {/* Transaction Details */}
                <AppCard className="overflow-visible">
                  <div className="border-border/50 border-b p-4">
                    <h3 className="text-foreground text-base font-medium">Transaction Details</h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">Who and how did you pay?</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <AppField
                        name="supplierName"
                        label="Who did you pay?"
                        description="Select an existing supplier or type a new name."
                      >
                        <ExpensePayeeSelector
                          name="supplierId"
                          supplierNameField="supplierName"
                          disabled={isReadOnly}
                        />
                      </AppField>

                      <AppField
                        name="paymentAccountId"
                        label="How did you pay? (Paid Now)"
                        description="Which bank or cash account did the money come from?"
                      >
                        <PaymentAccountSelector name="paymentAccountId" disabled={isReadOnly} />
                      </AppField>

                      <AppField name="purchaseDate" label="When did you spend it? *">
                        <FormInput name="purchaseDate" type="date" disabled={isReadOnly} />
                      </AppField>

                      <div className="flex flex-col justify-end">
                        <details className="group">
                          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium transition-colors outline-none select-none">
                            + Add Invoice Reference
                          </summary>
                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <AppField name="supplierInvoiceNumber" label="Invoice No.">
                              <FormInput
                                name="supplierInvoiceNumber"
                                type="text"
                                placeholder="INV-..."
                                disabled={isReadOnly}
                              />
                            </AppField>
                            <AppField name="supplierInvoiceDate" label="Invoice Date">
                              <FormInput
                                name="supplierInvoiceDate"
                                type="date"
                                disabled={isReadOnly}
                              />
                            </AppField>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                </AppCard>

                {/* Line Items */}
                <AppCard className="mt-2 flex flex-col overflow-visible">
                  <div className="border-border/50 border-b p-4">
                    <h3 className="text-foreground text-base font-medium">
                      What did you spend money on?
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Itemize your expenses below.
                    </p>
                  </div>
                  <div className="bg-background flex-1 rounded-b-md">
                    <ExpenseLineGrid
                      calculationState={{
                        totals: calculationState.totals,
                        isCalculating: calculationState.isCalculating,
                      }}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </AppCard>
              </div>

              {/* Right Column: Sidebar (4 cols on xl) */}
              <div className="flex flex-col gap-6 xl:col-span-4">
                {/* Totals */}
                <PurchaseTotalsCard
                  calculationState={{
                    totals: calculationState.totals,
                    isCalculating: calculationState.isCalculating,
                  }}
                />

                {/* Actions Card */}
                <AppCard className="p-5 shadow-sm">
                  <h3 className="text-foreground mb-4 text-sm font-medium">Actions</h3>
                  <div className="flex flex-col gap-3">
                    {isEditMode && currentStatus === 'DRAFT' && (
                      <AppButton
                        variant="default"
                        className="w-full justify-center"
                        onClick={handleSubmitPurchase}
                        disabled={isSubmitting || isCancelling || isSaving}
                        data-testid="submit-expense-btn"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Expense'}
                      </AppButton>
                    )}

                    {!isReadOnly && (
                      <AppButton
                        variant={isEditMode && currentStatus === 'DRAFT' ? 'outline' : 'default'}
                        className="w-full justify-center"
                        onClick={methods.handleSubmit((data) =>
                          handleFormSubmit(data as unknown as ExpenseUiValues),
                        )}
                        disabled={isSaving || isSubmitting || isCancelling}
                        data-testid="save-draft-expense-btn"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving
                          ? 'Saving...'
                          : currentStatus === 'SUBMITTED'
                            ? 'Save Changes'
                            : 'Save as Draft'}
                      </AppButton>
                    )}

                    {isEditMode && currentStatus !== 'CANCELLED' && (
                      <AppButton
                        variant="destructive"
                        className="w-full justify-center"
                        onClick={handleCancelPurchase}
                        disabled={isSubmitting || isCancelling || isSaving}
                        data-testid="cancel-expense-btn"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Expense'}
                      </AppButton>
                    )}

                    {isReadOnly && (
                      <AppButton
                        variant="secondary"
                        className="w-full justify-center"
                        onClick={() => router.push('/dashboard/expenses')}
                      >
                        Close
                      </AppButton>
                    )}

                    {!isReadOnly && (
                      <AppButton
                        variant="ghost"
                        className="w-full justify-center"
                        onClick={() => router.back()}
                        disabled={isSaving}
                      >
                        <X className="mr-2 h-4 w-4" /> Discard
                      </AppButton>
                    )}
                  </div>
                </AppCard>

                {/* Notes */}
                <AppCard className="border-border/40 bg-muted/10 p-4 shadow-none">
                  <h3 className="text-foreground mb-2 text-sm font-medium">Additional Notes</h3>
                  <textarea
                    className="border-border/50 bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any internal notes or memos..."
                    disabled={isReadOnly}
                    {...methods.register('notes')}
                  />
                </AppCard>
              </div>
            </div>
          </fieldset>
        </form>
      </FormProvider>
    </div>
  );
}
