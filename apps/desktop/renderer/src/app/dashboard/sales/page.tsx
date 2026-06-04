import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings, X, FilePlus, Copy, Printer, FileDown } from 'lucide-react';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { InvoiceLineGrid } from '@/components/forms/InvoiceLineGrid';
import { InvoiceTotalsCard } from '@/components/forms/InvoiceTotalsCard';
import { SalesCustomerSelector } from '@/components/forms/SalesCustomerSelector';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mapSalesInvoiceUiToDto, UiSalesInvoiceState } from '@/lib/mappers/salesInvoiceMapper';
import { salesInvoiceSchema } from '@/lib/validations/salesInvoiceSchema';

export default function SalesInvoiceShell() {
  const methods = useForm({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      lines: [
        {
          productId: null,
          productName: '',
          qty: 1,
          rate: 0,
          discountPercent: 0,
          taxPercent: 0,
          amount: 0,
        },
      ],
    },
  });
  const customerGstin = useWatch({ control: methods.control, name: 'customerGstin' });
  const customerAddress = useWatch({ control: methods.control, name: 'customerAddress' });

  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const onSubmit = async (data: UiSalesInvoiceState) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Placeholder company/financial year until these selectors are implemented
      const companyId = 'company_1';
      const financialYearId = 'fy_1';

      const payload = mapSalesInvoiceUiToDto(data, companyId, financialYearId);

      // Removed defensive checks since Zod validation guarantees they are valid.

      const res = await window.vyora.db.sales.createInvoice(payload);

      if (res.success) {
        setSuccessMsg(`Invoice saved successfully! (ID: ${res.data?.invoiceId})`);
        methods.reset(); // clear form
      } else {
        setErrorMsg(res.error || 'Failed to save invoice.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* --- Header Region --- */}
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
            title="Sales Invoice"
            description="Create a new sales invoice and manage line items."
          />
          <div className="flex items-center gap-3">
            {/* Future invoice status location */}
            <StatusBadge variant="secondary">Draft</StatusBadge>
            <div className="bg-border h-6 w-px" />
            <AppButton variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </AppButton>
          </div>
        </div>
      </div>

      {/* --- Toolbar Region --- */}
      <div className="shrink-0 px-6 py-2">
        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm">
            <FilePlus className="mr-2 h-4 w-4" /> New Invoice
          </AppButton>
          <AppButton variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </AppButton>
          <div className="bg-border mx-1 h-4 w-px" />
          <AppButton variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </AppButton>
          <AppButton variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </AppButton>
        </div>
      </div>

      {/* --- Scrollable Workspace --- */}
      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {/* Invoice Header Container */}
          <AppCard className="p-5">
            <h3 className="text-foreground mb-4 text-sm font-semibold">Invoice Details</h3>

            <FormProvider {...methods}>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                  {/* Left Group: Customer Info */}
                  <div className="col-span-1 grid gap-4 md:col-span-8 md:grid-cols-2">
                    <div className="col-span-1 md:col-span-2">
                      <AppField name="customer" label="Customer">
                        <SalesCustomerSelector
                          name="customer"
                          onCustomerSelect={(c) => {
                            if (c) {
                              methods.setValue('customerGstin', c.gstin || 'Unregistered');
                              methods.setValue(
                                'customerAddress',
                                [c.city, c.state].filter(Boolean).join(', ') ||
                                  'No address provided',
                              );
                            } else {
                              methods.setValue('customerGstin', '');
                              methods.setValue('customerAddress', '');
                            }
                          }}
                        />
                      </AppField>
                    </div>

                    <AppField name="customerGstin" label="Customer GSTIN">
                      <div className="border-border/50 bg-background/50 text-muted-foreground flex h-9 items-center rounded-md border border-dashed px-3 text-sm">
                        {customerGstin || '[Auto-filled GSTIN]'}
                      </div>
                    </AppField>

                    <AppField name="customerAddress" label="Billing Address">
                      <div className="border-border/50 bg-background/50 text-muted-foreground flex h-9 items-center truncate rounded-md border border-dashed px-3 text-sm">
                        {customerAddress || '[Auto-filled Address]'}
                      </div>
                    </AppField>

                    <div className="col-span-1 md:col-span-2">
                      <AppField name="placeOfSupply" label="Place of Supply">
                        <FormSelect
                          name="placeOfSupply"
                          options={[{ label: 'Placeholder State', value: 'placeholder' }]}
                          disabled
                        />
                      </AppField>
                    </div>
                  </div>

                  {/* Right Group: Invoice Metadata */}
                  <div className="col-span-1 grid gap-4 md:col-span-4">
                    <AppField name="invoiceNumber" label="Invoice Number">
                      <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm font-medium">
                        DRAFT-00001
                      </div>
                    </AppField>

                    <AppField name="invoiceDate" label="Invoice Date">
                      <FormInput name="invoiceDate" type="date" />
                    </AppField>

                    <AppField name="referenceNumber" label="Reference Number">
                      <FormInput
                        name="referenceNumber"
                        type="text"
                        placeholder="Optional PO or Ref..."
                      />
                    </AppField>
                  </div>
                </div>
              </form>
            </FormProvider>
          </AppCard>

          {/* Invoice Grid Container */}
          <AppCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div className="border-border bg-muted/40 shrink-0 border-b p-4">
              <h3 className="text-foreground text-sm font-semibold">Line Items</h3>
            </div>

            <InvoiceLineGrid />
          </AppCard>

          {/* Totals Container */}
          <div className="flex justify-end">
            <InvoiceTotalsCard className="w-full md:w-80" />
          </div>
        </div>
      </div>

      {/* --- Action Bar --- */}
      <div className="bg-background border-border z-10 shrink-0 border-t p-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <AppButton variant="ghost" className="text-muted-foreground">
            <X className="mr-2 h-4 w-4" /> Cancel
          </AppButton>
          <div className="flex items-center gap-3">
            <AppButton variant="outline">Save</AppButton>
            <AppButton
              className="w-full sm:w-auto"
              onClick={methods.handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Invoice'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
