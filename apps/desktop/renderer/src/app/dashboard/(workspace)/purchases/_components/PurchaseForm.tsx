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

import { PurchaseLineGrid } from './PurchaseLineGrid';
import { PurchaseSupplierSelector } from './PurchaseSupplierSelector';
import { PurchaseTotalsCard } from './PurchaseTotalsCard';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { RecordSettlementDialog } from '@/components/forms/RecordSettlementDialog';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  mapLinesToEngineInput,
  useAsyncInvoiceCalculation,
} from '@/lib/calculation/calculationAdapter';

// Create a local form schema to handle UI decimal states and date strings before mapping to DTO
const purchaseUiSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  supplierInvoiceNumber: z.string().optional().nullable(),
  supplierInvoiceDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        productId: z.string().nullable(),
        description: z.string().optional().nullable(),
        unitId: z.string().optional(),
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
});

type PurchaseUiValues = z.infer<typeof purchaseUiSchema>;

interface PurchaseFormProps {
  isEditMode?: boolean;
  initialData?: PurchaseDto;
  forceReadOnly?: boolean;
}

export function PurchaseForm({ isEditMode, initialData, forceReadOnly }: PurchaseFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [activeCompanyId, setActiveCompanyId] = React.useState<string>('');
  const [activeFinancialYearId, setActiveFinancialYearId] = React.useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  const defaultValues = initialData
    ? {
        supplierId: initialData.supplierId,
        purchaseDate: new Date(initialData.purchaseDate).toISOString().split('T')[0],
        supplierInvoiceNumber: initialData.supplierInvoiceNumber || '',
        supplierInvoiceDate: initialData.supplierInvoiceDate
          ? new Date(initialData.supplierInvoiceDate).toISOString().split('T')[0]
          : '',
        notes: initialData.notes || '',
        lines: initialData.lines.map((line) => ({
          productId: line.productId,
          description: line.description || '',
          unitId: line.unitId,
          taxId: line.taxId,
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
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: '',
        supplierInvoiceDate: '',
        notes: '',
        lines: [
          {
            productId: null,
            description: '',
            unitId: '',
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

  const methods = useForm<PurchaseUiValues>({
    resolver: zodResolver(purchaseUiSchema),
    defaultValues: defaultValues as import('react-hook-form').DefaultValues<PurchaseUiValues>,
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

  const onSubmit = async (data: PurchaseUiValues) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!activeCompanyId) throw new Error('No active company found');

      // Filter out empty lines (where productId is null or empty)
      const validLines = (data.lines || []).filter((line) => !!line.productId);

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
          productId: uiLine.productId!,
          unitId: uiLine.unitId || undefined,
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

      const payload: Omit<CreatePurchaseInput, 'companyId'> & { status: InvoiceStatus } = {
        financialYearId: activeFinancialYearId,
        documentType: 'PURCHASE',
        purchaseDate: new Date(data.purchaseDate),
        supplierId: data.supplierId,
        supplierInvoiceNumber: data.supplierInvoiceNumber || undefined,
        supplierInvoiceDate: data.supplierInvoiceDate
          ? new Date(data.supplierInvoiceDate)
          : undefined,
        isReverseCharge: false,
        notes: data.notes || undefined,
        subtotal: computedTotals.subtotal,
        discountAmount: computedTotals.totalDiscount,
        taxAmount: computedTotals.totalTax,
        roundOffAmount: computedTotals.roundOffAmount,
        grandTotal: computedTotals.grandTotal,
        lines: items,
        status: 'DRAFT', // we only ever save/update as draft
      };

      if (isEditMode && initialData) {
        // Edit mode
        const res = await window.vyora.db.purchases.update({
          id: initialData.id,
          ...payload,
        });

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
          setSuccessMsg(`Purchase saved successfully!`);
          // Purchases returns a string ID directly, unlike Sales which returns an object
          router.push(`/dashboard/purchases/edit?id=${res.data}`);
        } else {
          setErrorMsg(res.error || 'Failed to save purchase');
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
        toast.success('Purchase submitted successfully!');
        setTimeout(() => router.push('/dashboard/purchases'), 150);
      } else {
        setErrorMsg(res.error || 'Failed to submit purchase.');
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
        toast.success('Purchase cancelled successfully!');
        setTimeout(() => router.push('/dashboard/purchases'), 150);
      } else {
        setErrorMsg(res.error || 'Failed to cancel purchase.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while cancelling.');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStatus = initialData?.status || 'DRAFT';
  const isReadOnly =
    forceReadOnly || currentStatus === 'SUBMITTED' || currentStatus === 'CANCELLED';

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
          <div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            {successMsg}
          </div>
        )}
        <div className="flex items-start justify-between">
          <SectionHeader
            title={isEditMode ? 'Edit Purchase' : 'New Purchase'}
            description="Manage purchase invoices and supplier details"
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
          className="scrollbar-thumb-border flex-1 scrollbar-thin overflow-y-auto px-6 pb-20"
          onSubmit={(e) => e.preventDefault()}
        >
          <fieldset disabled={isSaving || isReadOnly} className="flex flex-col gap-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column: Details */}
              <div className="col-span-12 flex flex-col gap-6 xl:col-span-9">
                {/* Supplier Details */}
                <AppCard className="p-5">
                  <h3 className="text-foreground mb-4 text-sm font-semibold">Supplier Details</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AppField name="supplierId" label="Supplier *">
                      <PurchaseSupplierSelector name="supplierId" disabled={isReadOnly} />
                    </AppField>

                    <AppField name="purchaseDate" label="Purchase Date *">
                      <FormInput name="purchaseDate" type="date" disabled={isReadOnly} />
                    </AppField>

                    <AppField name="supplierInvoiceNumber" label="Supplier Inv. No.">
                      <FormInput
                        name="supplierInvoiceNumber"
                        type="text"
                        placeholder="INV-..."
                        disabled={isReadOnly}
                      />
                    </AppField>

                    <AppField name="supplierInvoiceDate" label="Supplier Inv. Date">
                      <FormInput name="supplierInvoiceDate" type="date" disabled={isReadOnly} />
                    </AppField>
                  </div>
                </AppCard>

                {/* Line Items */}
                <AppCard className="flex flex-col overflow-hidden">
                  <div className="border-border/50 border-b p-4">
                    <h3 className="text-foreground text-sm font-semibold">Line Items</h3>
                  </div>
                  <div className="bg-background flex-1">
                    <PurchaseLineGrid
                      calculationState={{
                        totals: calculationState.totals,
                        isCalculating: calculationState.isCalculating,
                      }}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </AppCard>

                {/* Notes */}
                <AppCard className="p-5">
                  <h3 className="text-foreground mb-4 text-sm font-semibold">Internal Notes</h3>
                  <textarea
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add notes..."
                    disabled={isReadOnly}
                    {...methods.register('notes')}
                  />
                </AppCard>
              </div>

              {/* Right Column: Totals */}
              <div className="col-span-12 flex flex-col gap-6 xl:col-span-3">
                <PurchaseTotalsCard
                  calculationState={{
                    totals: calculationState.totals,
                    isCalculating: calculationState.isCalculating,
                  }}
                />
              </div>
            </div>
          </fieldset>
        </form>
      </FormProvider>

      {/* Action Footer */}
      <div className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/60 absolute right-0 bottom-0 left-0 flex items-center justify-between border-t p-4 px-6 backdrop-blur">
        <AppButton variant="outline" onClick={() => router.back()} disabled={isSaving}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </AppButton>
        <div className="flex gap-3">
          {isEditMode && currentStatus === 'DRAFT' && (
            <AppButton
              variant="default"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleSubmitPurchase}
              disabled={isSubmitting || isCancelling || isSaving}
              data-testid="submit-purchase-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Purchase'}
            </AppButton>
          )}

          {isEditMode &&
            (currentStatus === 'SUBMITTED' || currentStatus === 'PARTIALLY_PAID') &&
            initialData && (
              <AppButton
                variant="default"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={isSubmitting || isCancelling || isSaving}
                data-testid="record-payment-purchase-btn"
              >
                Record Payment
              </AppButton>
            )}

          {isEditMode && currentStatus !== 'CANCELLED' && (
            <AppButton
              variant="destructive"
              onClick={handleCancelPurchase}
              disabled={isSubmitting || isCancelling || isSaving}
              data-testid="cancel-purchase-btn"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Purchase'}
            </AppButton>
          )}

          {!isReadOnly && (
            <AppButton
              variant="secondary"
              onClick={methods.handleSubmit((data) =>
                onSubmit(data as unknown as z.infer<typeof purchaseUiSchema>),
              )}
              disabled={isSaving || isSubmitting || isCancelling}
              data-testid="save-draft-purchase-btn"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </AppButton>
          )}

          {isReadOnly && (
            <AppButton variant="secondary" onClick={() => router.push('/dashboard/purchases')}>
              Close
            </AppButton>
          )}
        </div>
      </div>

      {isEditMode && initialData && (
        <RecordSettlementDialog
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type="PAYMENT"
          defaultPartyId={initialData.supplierId}
          defaultAllocationId={initialData.id}
          defaultAmount={initialData.balanceDue ?? 0}
          onSuccess={() => {
            toast.success('Payment recorded successfully!');
            router.push('/dashboard/purchases');
          }}
        />
      )}
    </div>
  );
}
