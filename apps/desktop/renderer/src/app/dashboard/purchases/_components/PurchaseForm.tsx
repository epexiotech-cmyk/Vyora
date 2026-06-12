'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePurchaseInput, PurchaseDto, PurchaseStatus } from '@vyora/types';
import { paiseToMoney } from '@vyora/utils';
import { Save, FileCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';

import { calculatePurchaseTotals } from './purchase-calculations';
import { PurchaseLineGrid } from './PurchaseLineGrid';
import { PurchaseSupplierSelector } from './PurchaseSupplierSelector';
import { PurchaseTotalsCard } from './PurchaseTotalsCard';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [activeCompanyId, setActiveCompanyId] = React.useState<string>('');
  const [activeFinancialYearId, setActiveFinancialYearId] = React.useState<string>('');

  React.useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const companyRes = await window.vyora.company.getActive();
        if (companyRes.success && companyRes.data) {
          setActiveCompanyId(companyRes.data);
        }
        // In a real app we'd fetch active financial year, for now use a placeholder
        setActiveFinancialYearId('fy-2026-2027');
      } catch (err) {
        console.error('Failed to load active contexts', err);
      }
    };
    fetchDependencies();
  }, []);

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

  const onSubmit = async (data: PurchaseUiValues, status: PurchaseStatus) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!activeCompanyId) throw new Error('No active company found');

      // Delegate logic to single source of truth helper
      const computedTotals = calculatePurchaseTotals(
        data.lines.filter((line) => line.productId && line.quantity > 0),
      );

      if (computedTotals.items.length === 0) {
        throw new Error('Please add at least one valid line item');
      }

      // Map back to the DTO contract mapping
      const items = computedTotals.items.map((line) => ({
        productId: line.productId!,
        unitId: line.unitId || 'default-unit',
        taxId: line.taxId || 'default-tax',
        description: line.description || undefined,
        quantity: line.quantity,
        rate: line.paiseRate,
        discountAmount: line.paiseDiscount,
        taxableAmount: line.lineTaxable,
        taxAmount: line.lineTax,
        lineTotal: line.lineTotal,
      }));

      const payload: Omit<CreatePurchaseInput, 'companyId'> & { status: PurchaseStatus } = {
        financialYearId: activeFinancialYearId,
        purchaseDate: new Date(data.purchaseDate),
        supplierId: data.supplierId,
        supplierInvoiceNumber: data.supplierInvoiceNumber || undefined,
        supplierInvoiceDate: data.supplierInvoiceDate
          ? new Date(data.supplierInvoiceDate)
          : undefined,
        notes: data.notes || undefined,
        subtotal: computedTotals.subtotal,
        discountAmount: computedTotals.discountTotal,
        taxAmount: computedTotals.taxTotal,
        roundOffAmount: computedTotals.roundOffAmount,
        grandTotal: computedTotals.grandTotal,
        lines: items,
        status: status,
      };

      if (isEditMode && initialData) {
        // Edit mode
        const res = await window.vyora.db.purchases.update({
          id: initialData.id,
          ...payload,
        });

        if (res.success) {
          setSuccessMsg(`Purchase updated successfully!`);
          router.push('/dashboard/purchases');
        } else {
          setErrorMsg(res.error || 'Failed to update purchase');
        }
      } else {
        // Create mode
        // For phase 5.5.9C, we simulate the backend call or pass it properly
        // Note: The IPC contract expects (data, status) ? We will send status in wrapper if supported, or via service layer
        const res = await window.vyora.db.purchases.create({
          ...payload,
          // Workaround for creating a purchase with specific status, the schema doesn't accept status but the backend does natively inside service
        });

        if (res.success) {
          setSuccessMsg(`Purchase saved successfully!`);
          router.push('/dashboard/purchases');
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

  const submitPurchase = (status: PurchaseStatus) =>
    methods.handleSubmit((data) => onSubmit(data as PurchaseUiValues, status));

  const currentStatus = initialData?.status || 'DRAFT';
  const isReadOnly = forceReadOnly || currentStatus !== 'DRAFT';

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
            <StatusBadge variant={currentStatus === 'DRAFT' ? 'warning' : 'success'}>
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
                      <PurchaseSupplierSelector name="supplierId" />
                    </AppField>

                    <AppField name="purchaseDate" label="Purchase Date *">
                      <FormInput name="purchaseDate" type="date" />
                    </AppField>

                    <AppField name="supplierInvoiceNumber" label="Supplier Inv. No.">
                      <FormInput name="supplierInvoiceNumber" type="text" placeholder="INV-..." />
                    </AppField>

                    <AppField name="supplierInvoiceDate" label="Supplier Inv. Date">
                      <FormInput name="supplierInvoiceDate" type="date" />
                    </AppField>
                  </div>
                </AppCard>

                {/* Line Items */}
                <AppCard className="flex flex-col overflow-hidden">
                  <div className="border-border/50 border-b p-4">
                    <h3 className="text-foreground text-sm font-semibold">Line Items</h3>
                  </div>
                  <div className="bg-background flex-1">
                    <PurchaseLineGrid />
                  </div>
                </AppCard>

                {/* Notes */}
                <AppCard className="p-5">
                  <h3 className="text-foreground mb-4 text-sm font-semibold">Internal Notes</h3>
                  <textarea
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                    placeholder="Add notes..."
                    {...methods.register('notes')}
                  />
                </AppCard>
              </div>

              {/* Right Column: Totals */}
              <div className="col-span-12 flex flex-col gap-6 xl:col-span-3">
                <PurchaseTotalsCard />
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
          {!isReadOnly && (
            <>
              <AppButton variant="secondary" disabled={isSaving} onClick={submitPurchase('DRAFT')}>
                <Save className="mr-2 h-4 w-4" /> Save as Draft
              </AppButton>
              <AppButton
                variant="default"
                disabled={isSaving}
                onClick={submitPurchase('COMPLETED')}
              >
                <FileCheck className="mr-2 h-4 w-4" /> Complete Purchase
              </AppButton>
            </>
          )}
          {isReadOnly && (
            <AppButton variant="secondary" onClick={() => router.push('/dashboard/purchases')}>
              Close
            </AppButton>
          )}
        </div>
      </div>
    </div>
  );
}
