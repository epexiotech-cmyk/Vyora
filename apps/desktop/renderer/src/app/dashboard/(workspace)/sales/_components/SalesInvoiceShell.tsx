'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesInvoicePrintAdapter } from '@vyora/print-engine';
import { SalesInvoiceDto } from '@vyora/types';
import { getStateFromGstin } from '@vyora/utils';
import { Save, Settings, X, FilePlus, Copy, Printer, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { InvoiceLineGrid } from '@/components/forms/InvoiceLineGrid';
import { InvoiceTotalsCard } from '@/components/forms/InvoiceTotalsCard';
import { SalesCustomerSelector } from '@/components/forms/SalesCustomerSelector';
import { ConstrainedSection } from '@/components/layout/ConstrainedSection';
import { usePrintPreview } from '@/components/print/usePrintPreview';
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
import { mapSalesInvoiceUiToDto } from '@/lib/mappers/salesInvoiceMapper';
import { salesInvoiceSchema, SalesInvoiceFormValues } from '@/lib/validations/salesInvoiceSchema';

interface SalesInvoiceShellProps {
  isEditMode?: boolean;
  initialData?: SalesInvoiceDto;
}

export function SalesInvoiceShell({ isEditMode, initialData }: SalesInvoiceShellProps) {
  const router = useRouter();

  // If we have initialData, we map it to the UI state
  const defaultValues = initialData
    ? {
        ...initialData,
        invoiceDate: initialData.invoiceDate
          ? new Date(initialData.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        customer: initialData.customerId,
        shippingSameAsBilling: false,
        lines:
          initialData.items?.map((item) => ({
            productId: item.productId,
            productName: item.description || '',
            qty: item.quantity,
            rate: item.rate / 100, // Convert from cents
            discountPercent:
              item.quantity > 0 && item.rate > 0
                ? (item.discountAmount / (item.quantity * item.rate)) * 100
                : 0,
            taxPercent: item.taxRateSnapshot || 0,
            amount: item.lineTotal / 100, // Convert from cents
            unitId: item.unitId,
            taxId: item.taxId,
            hsnCode: item.hsnCode,
            itemTypeSnapshot: item.itemTypeSnapshot || null,
          })) || [],
      }
    : {
        invoiceDate: new Date().toISOString().split('T')[0],
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
        shippingSameAsBilling: true,
      };

  const methods = useForm<SalesInvoiceFormValues>({
    // @ts-expect-error: z.coerce.number() causes input type to be unknown which conflicts with RHF's expectation
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues:
      defaultValues as unknown as import('react-hook-form').DefaultValues<SalesInvoiceFormValues>,
  });
  const shippingSameAsBilling = useWatch({
    control: methods.control,
    name: 'shippingSameAsBilling',
  });

  const printPayload = React.useMemo(() => {
    if (!initialData) return null;
    return SalesInvoicePrintAdapter.toPayload(initialData);
  }, [initialData]);

  const { print } = usePrintPreview('gst-invoice-v1', printPayload);

  // Watch billing fields for auto-copying
  const billingName = useWatch({ control: methods.control, name: 'billingName' });
  const billingGstin = useWatch({ control: methods.control, name: 'billingGstin' });
  const billingAddress = useWatch({ control: methods.control, name: 'billingAddress' });
  const billingCity = useWatch({ control: methods.control, name: 'billingCity' });
  const billingDistrict = useWatch({ control: methods.control, name: 'billingDistrict' });
  const billingStateCode = useWatch({ control: methods.control, name: 'billingStateCode' });
  const billingStateName = useWatch({ control: methods.control, name: 'billingStateName' });
  const billingPincode = useWatch({ control: methods.control, name: 'billingPincode' });
  const shippingGstin = useWatch({ control: methods.control, name: 'shippingGstin' });
  const shippingPincode = useWatch({ control: methods.control, name: 'shippingPincode' });
  const placeOfSupplyCode = useWatch({ control: methods.control, name: 'placeOfSupplyCode' });

  // Auto-detect State from Billing GSTIN
  React.useEffect(() => {
    if (billingGstin && billingGstin.length >= 2) {
      const stateInfo = getStateFromGstin(billingGstin);
      if (stateInfo) {
        methods.setValue('billingStateCode', stateInfo.stateCode);
        methods.setValue('billingStateName', stateInfo.stateName);
        methods.setValue('placeOfSupplyCode', stateInfo.stateCode);
      }
    }
  }, [billingGstin, methods]);

  // Auto-detect State from Shipping GSTIN
  React.useEffect(() => {
    if (shippingGstin && shippingGstin.length >= 2 && !shippingSameAsBilling) {
      const stateInfo = getStateFromGstin(shippingGstin);
      if (stateInfo) {
        methods.setValue('shippingStateCode', stateInfo.stateCode);
        methods.setValue('shippingStateName', stateInfo.stateName);
      }
    }
  }, [shippingGstin, shippingSameAsBilling, methods]);

  // Smart Pincode Lookup - Billing
  React.useEffect(() => {
    if (billingPincode && /^[1-9][0-9]{5}$/.test(billingPincode)) {
      const lookup = async () => {
        try {
          if (window.vyora?.directories?.pincode) {
            const res = await window.vyora.directories.pincode.smartLookup(billingPincode);
            if (res && res.offices && res.offices.length > 0) {
              const office = res.offices[0];
              if (!methods.getValues('billingCity') && office.district) {
                methods.setValue('billingCity', office.district, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              if (!methods.getValues('billingDistrict') && office.district) {
                methods.setValue('billingDistrict', office.district, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }
          }
        } catch (err) {
          console.warn('Smart pincode lookup failed in UI', err);
        }
      };
      lookup();
    }
  }, [billingPincode, methods]);

  // Smart Pincode Lookup - Shipping
  React.useEffect(() => {
    if (shippingPincode && /^[1-9][0-9]{5}$/.test(shippingPincode) && !shippingSameAsBilling) {
      const lookup = async () => {
        try {
          if (window.vyora?.directories?.pincode) {
            const res = await window.vyora.directories.pincode.smartLookup(shippingPincode);
            if (res && res.offices && res.offices.length > 0) {
              const office = res.offices[0];
              if (!methods.getValues('shippingCity') && office.district) {
                methods.setValue('shippingCity', office.district, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              if (!methods.getValues('shippingDistrict') && office.district) {
                methods.setValue('shippingDistrict', office.district, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }
          }
        } catch (err) {
          console.warn('Smart pincode lookup failed in UI', err);
        }
      };
      lookup();
    }
  }, [shippingPincode, shippingSameAsBilling, methods]);

  React.useEffect(() => {
    if (shippingSameAsBilling) {
      methods.setValue('shippingName', billingName || '');
      methods.setValue('shippingGstin', billingGstin || '');
      methods.setValue('shippingAddress', billingAddress || '');
      methods.setValue('shippingCity', billingCity || '');
      methods.setValue('shippingDistrict', billingDistrict || '');
      methods.setValue('shippingStateCode', billingStateCode || '');
      methods.setValue('shippingStateName', billingStateName || '');
      methods.setValue('shippingPincode', billingPincode || '');
    }
  }, [
    shippingSameAsBilling,
    billingName,
    billingGstin,
    billingAddress,
    billingCity,
    billingDistrict,
    billingStateCode,
    billingStateName,
    billingPincode,
    methods,
  ]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [savedInvoiceId, setSavedInvoiceId] = React.useState<string | null>(null);
  const [pinPromptOpen, setPinPromptOpen] = React.useState(false);

  const [pinLength, setPinLength] = React.useState(4);
  const [pinArray, setPinArray] = React.useState<string[]>(Array(4).fill(''));
  const pinRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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
  const [pendingSubmitData, setPendingSubmitData] = React.useState<SalesInvoiceFormValues | null>(
    null,
  );

  const [confirmModalState, setConfirmModalState] = React.useState<{
    isOpen: boolean;
    action: 'SUBMIT' | 'CANCEL' | null;
  }>({ isOpen: false, action: null });

  const currentStatus = initialData?.status || 'DRAFT';
  const isReadOnly = currentStatus === 'CANCELLED';

  // @ts-expect-error - react-hook-form strict typing mismatch
  const calculationState = useAsyncInvoiceCalculation('sales', methods.control);

  const handleFormSubmit = (data: SalesInvoiceFormValues) => {
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

  const onSubmit = async (data: SalesInvoiceFormValues, pin?: string) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setSavedInvoiceId(null);

      const companyRes = await window.vyora.company.getActive();
      const fyRes = await window.vyora.financialYear.getCurrent();

      if (!companyRes.success || !companyRes.data) {
        setErrorMsg('Failed to resolve active company.');
        setIsSaving(false);
        return;
      }

      const companyProfileRes = await window.vyora.company.getProfile(companyRes.data);
      if (!companyProfileRes.success || !companyProfileRes.data) {
        setErrorMsg('Failed to fetch company profile.');
        setIsSaving(false);
        return;
      }

      if (!fyRes.success || !fyRes.data) {
        setErrorMsg('Failed to resolve active financial year.');
        setIsSaving(false);
        return;
      }

      const validLines = (data.lines || []).filter((line) => !!line.productId);
      data.lines = validLines; // ensure the mapper only processes valid lines

      const engineInput = mapLinesToEngineInput(validLines, 'sales');
      const calcResponse = await window.vyora.calculation.calculateInvoice(engineInput);

      if (!calcResponse || !calcResponse.success || !calcResponse.data) {
        setErrorMsg('Failed to calculate invoice totals from backend engine.');
        setIsSaving(false);
        return;
      }

      const calculationResult = calcResponse.data;

      const payload = mapSalesInvoiceUiToDto(
        data,
        companyProfileRes.data,
        fyRes.data.id,
        calculationResult,
        engineInput,
      );

      if (isEditMode && initialData) {
        // Edit Mode
        const res = await window.vyora.db.sales.updateDraft(initialData.id, payload, pin);
        if (res.success) {
          setSuccessMsg(`Draft updated successfully!`);
          setSavedInvoiceId(res.data?.id || null);
          router.push(`/sales/invoices/preview?id=${initialData.id}`);
        } else {
          setErrorMsg(res.error || 'Failed to update draft.');
        }
      } else {
        // Create Mode
        const res = await window.vyora.db.sales.createInvoice(payload);
        if (res.success) {
          setSuccessMsg(`Invoice saved successfully! (ID: ${res.data?.invoiceId})`);
          setSavedInvoiceId(res.data?.invoiceId || null);
          methods.reset(); // clear form
          router.push(`/dashboard/sales/edit?id=${res.data?.invoiceId}`);
        } else {
          setErrorMsg(res.error || 'Failed to save invoice.');
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitInvoice = async () => {
    if (!initialData?.id) return;
    setConfirmModalState({ isOpen: true, action: 'SUBMIT' });
  };

  const executeSubmitInvoice = async () => {
    if (!initialData?.id) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await window.vyora.db.sales.submitInvoice(initialData.id);
      if (res.success) {
        setSuccessMsg('Invoice submitted successfully!');
        router.push(`/sales/invoices/preview?id=${initialData.id}`);
      } else {
        setErrorMsg(res.error || 'Failed to submit invoice.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
      setConfirmModalState({ isOpen: false, action: null });
    }
  };

  const handleCancelInvoice = async () => {
    if (!initialData?.id) return;
    setConfirmModalState({ isOpen: true, action: 'CANCEL' });
  };

  const executeCancelInvoice = async () => {
    if (!initialData?.id) return;
    try {
      setIsCancelling(true);
      setErrorMsg(null);
      const res = await window.vyora.db.sales.cancelInvoice(initialData.id);
      if (res.success) {
        setSuccessMsg('Invoice cancelled successfully!');
        window.location.reload();
      } else {
        setErrorMsg(res.error || 'Failed to cancel invoice.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while cancelling.');
    } finally {
      setIsCancelling(false);
      setConfirmModalState({ isOpen: false, action: null });
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
          <div className="mb-4 flex items-center justify-between rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            <span>{successMsg}</span>
            {savedInvoiceId && (
              <a
                href={`/sales/invoices/${savedInvoiceId}/preview`}
                className="rounded border border-green-200 bg-white px-3 py-1 font-medium text-green-700 transition-colors hover:bg-green-50"
              >
                Open Preview
              </a>
            )}
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
              WORNING: You are editing an already submitted invoice. This will reverse and repost
              accounting and inventory entries. Please enter your PIN to authorize.
            </p>
            <div className="flex justify-center space-x-3">
              {pinArray.map((digit, index) => (
                <AppInput
                  key={index}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  ref={(el) => {
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

        {/* Action Confirmation Modal */}
        <AppModal
          isOpen={confirmModalState.isOpen}
          onClose={() => setConfirmModalState({ isOpen: false, action: null })}
          title={
            confirmModalState.action === 'SUBMIT' ? 'Confirm Submission' : 'Confirm Cancellation'
          }
          description={
            confirmModalState.action === 'SUBMIT'
              ? 'Are you sure? This will post inventory and accounting entries and lock the invoice.'
              : 'Are you sure? If submitted, ledger entries will be reversed.'
          }
          confirmLabel={confirmModalState.action === 'SUBMIT' ? 'Submit Invoice' : 'Cancel Invoice'}
          onConfirm={
            confirmModalState.action === 'SUBMIT' ? executeSubmitInvoice : executeCancelInvoice
          }
          isLoading={isSubmitting || isCancelling}
        />
        <div className="flex items-start justify-between">
          <SectionHeader
            title={isEditMode ? 'Edit Sales Invoice' : 'Sales Invoice'}
            description={
              isEditMode
                ? 'Update draft invoice details.'
                : 'Create a new sales invoice and manage line items.'
            }
          />
          <div className="flex items-center gap-3">
            <StatusBadge
              data-testid="sales-status-badge"
              variant={
                currentStatus === 'SUBMITTED'
                  ? 'success'
                  : currentStatus === 'CANCELLED'
                    ? 'destructive'
                    : 'warning'
              }
            >
              {currentStatus}
            </StatusBadge>
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
          {!isEditMode && (
            <AppButton variant="outline" size="sm">
              <FilePlus className="mr-2 h-4 w-4" /> New Invoice
            </AppButton>
          )}
          <AppButton variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </AppButton>
          <div className="bg-border mx-1 h-4 w-px" />
          <AppButton variant="outline" size="sm" disabled={!initialData} onClick={() => print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </AppButton>
          <AppButton variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </AppButton>
        </div>
      </div>

      {/* --- Scrollable Workspace --- */}
      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()} className="flex w-full flex-col gap-6">
            {/* Invoice Header Container */}
            <ConstrainedSection>
              <AppCard className="p-5">
                <h3 className="text-foreground mb-4 text-sm font-semibold">Invoice Details</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                  {/* Left Group: Customer & Addresses Info */}
                  <div className="col-span-1 grid gap-4 md:col-span-8">
                    <AppField name="customer" label="Customer Master">
                      <SalesCustomerSelector
                        name="customer"
                        disabled={isReadOnly}
                        onCustomerSelect={(c) => {
                          if (c) {
                            methods.setValue('billingName', c.name || '');
                            methods.setValue('billingGstin', c.gstin || '');
                            methods.setValue('billingAddress', c.addressLine1 || '');
                            methods.setValue('billingCity', c.city || '');
                            methods.setValue('billingDistrict', c.district || '');
                            methods.setValue('billingPincode', c.pincode || '');
                            methods.setValue('billingStateName', c.state || '');
                          } else {
                            methods.setValue('billingName', '');
                            methods.setValue('billingGstin', '');
                            methods.setValue('billingAddress', '');
                            methods.setValue('billingCity', '');
                            methods.setValue('billingStateName', '');
                          }
                        }}
                      />
                    </AppField>

                    <div className="grid grid-cols-1 gap-6 rounded-md border p-4 md:grid-cols-2">
                      {/* Billing Address Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Billing Details</h4>
                        <AppField name="billingName" label="Billing Name">
                          <FormInput name="billingName" type="text" disabled={isReadOnly} />
                        </AppField>
                        <AppField name="billingGstin" label="Billing GSTIN">
                          <FormInput name="billingGstin" type="text" disabled={isReadOnly} />
                        </AppField>
                        <AppField name="billingAddress" label="Address">
                          <FormInput name="billingAddress" type="text" disabled={isReadOnly} />
                        </AppField>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <AppField name="billingCity" label="City">
                            <FormInput name="billingCity" type="text" disabled={isReadOnly} />
                          </AppField>
                          <AppField name="billingPincode" label="PIN Code">
                            <FormInput name="billingPincode" type="text" disabled={isReadOnly} />
                          </AppField>
                          <AppField name="billingDistrict" label="District">
                            <FormInput name="billingDistrict" type="text" disabled={isReadOnly} />
                          </AppField>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <AppField name="billingStateCode" label="State Code">
                            <FormInput name="billingStateCode" type="text" disabled={isReadOnly} />
                          </AppField>
                          <AppField name="billingStateName" label="State Name">
                            <FormInput name="billingStateName" type="text" disabled={isReadOnly} />
                          </AppField>
                        </div>
                      </div>

                      {/* Shipping Address Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Shipping Details</h4>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="shippingSameAsBilling"
                              disabled={isReadOnly}
                              {...methods.register('shippingSameAsBilling')}
                              className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                            />
                            <label
                              htmlFor="shippingSameAsBilling"
                              className="text-muted-foreground text-xs"
                            >
                              Same as Billing
                            </label>
                          </div>
                        </div>

                        {!shippingSameAsBilling && (
                          <>
                            <AppField name="shippingName" label="Shipping Name">
                              <FormInput name="shippingName" type="text" disabled={isReadOnly} />
                            </AppField>
                            <AppField name="shippingGstin" label="Shipping GSTIN">
                              <FormInput name="shippingGstin" type="text" disabled={isReadOnly} />
                            </AppField>
                            <AppField name="shippingAddress" label="Address">
                              <FormInput name="shippingAddress" type="text" disabled={isReadOnly} />
                            </AppField>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <AppField name="shippingCity" label="City">
                                <FormInput name="shippingCity" type="text" disabled={isReadOnly} />
                              </AppField>
                              <AppField name="shippingPincode" label="PIN Code">
                                <FormInput
                                  name="shippingPincode"
                                  type="text"
                                  disabled={isReadOnly}
                                />
                              </AppField>
                              <AppField name="shippingDistrict" label="District">
                                <FormInput
                                  name="shippingDistrict"
                                  type="text"
                                  disabled={isReadOnly}
                                />
                              </AppField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <AppField name="shippingStateCode" label="State Code">
                                <FormInput
                                  name="shippingStateCode"
                                  type="text"
                                  disabled={isReadOnly}
                                />
                              </AppField>
                              <AppField name="shippingStateName" label="State Name">
                                <FormInput
                                  name="shippingStateName"
                                  type="text"
                                  disabled={isReadOnly}
                                />
                              </AppField>
                            </div>
                          </>
                        )}
                        {shippingSameAsBilling && (
                          <div className="text-muted-foreground bg-muted/20 flex h-full items-center justify-center rounded-md border border-dashed p-8 text-center text-sm italic">
                            Shipping details will mirror billing details.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <AppField name="placeOfSupplyCode" label="Place of Supply (State Code)">
                        <FormInput
                          name="placeOfSupplyCode"
                          type="text"
                          placeholder="e.g. 27"
                          disabled={isReadOnly}
                        />
                      </AppField>
                    </div>
                  </div>

                  {/* Right Group: Invoice Metadata */}
                  <div className="col-span-1 grid gap-4 md:col-span-4">
                    <AppField name="invoiceNumber" label="Invoice Number">
                      <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm font-medium">
                        {isEditMode && initialData?.invoiceNumber
                          ? initialData.invoiceNumber
                          : 'DRAFT-00001'}
                      </div>
                    </AppField>

                    <AppField name="invoiceDate" label="Invoice Date">
                      <FormInput name="invoiceDate" type="date" disabled={isReadOnly} />
                    </AppField>

                    <AppField name="referenceNumber" label="Reference Number">
                      <FormInput
                        name="referenceNumber"
                        type="text"
                        placeholder="Optional PO or Ref..."
                        disabled={isReadOnly}
                      />
                    </AppField>
                  </div>
                </div>
              </AppCard>
            </ConstrainedSection>

            {/* Invoice Grid Container */}
            <AppCard className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 p-0 shadow-sm">
              <div className="border-border bg-muted/40 shrink-0 border-b p-4">
                <h3 className="text-foreground text-sm font-semibold">Line Items</h3>
              </div>

              <InvoiceLineGrid
                calculationState={{
                  totals: calculationState.totals,
                  isCalculating: calculationState.isCalculating,
                }}
                isReadOnly={isReadOnly}
              />
            </AppCard>

            {/* Totals Container */}
            <ConstrainedSection>
              <div className="flex justify-end">
                <InvoiceTotalsCard
                  className="w-full lg:max-w-xl"
                  calculationState={{
                    totals: calculationState.totals,
                    isCalculating: calculationState.isCalculating,
                  }}
                  placeOfSupplyCode={placeOfSupplyCode}
                />
              </div>
            </ConstrainedSection>
          </form>
        </FormProvider>
      </div>

      {/* --- Action Bar --- */}
      <div className="bg-background border-border z-10 shrink-0 border-t p-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <AppButton
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => router.push('/dashboard/sales')}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </AppButton>
          <div className="flex items-center gap-3">
            {isEditMode && currentStatus === 'DRAFT' && (
              <AppButton
                variant="default"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleSubmitInvoice}
                disabled={isSubmitting || isCancelling || isSaving}
                data-testid="submit-sales-btn"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Invoice'}
              </AppButton>
            )}

            {isEditMode && currentStatus !== 'CANCELLED' && (
              <AppButton
                variant="destructive"
                onClick={handleCancelInvoice}
                disabled={isSubmitting || isCancelling || isSaving}
                data-testid="cancel-sales-btn"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Invoice'}
              </AppButton>
            )}

            {!isReadOnly && (
              <AppButton
                onClick={methods.handleSubmit((data) =>
                  handleFormSubmit(data as unknown as SalesInvoiceFormValues),
                )}
                disabled={isSaving || isSubmitting || isCancelling}
                data-testid="save-draft-sales-btn"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving
                  ? 'Saving...'
                  : isEditMode
                    ? currentStatus === 'SUBMITTED'
                      ? 'Save & Repost'
                      : 'Update Draft'
                    : 'Save Draft'}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
