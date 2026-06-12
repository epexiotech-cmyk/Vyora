'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSupplierInput, createSupplierSchema } from '@vyora/types';
import { extractPanFromGstin, extractStateCodeFromGstin } from '@vyora/utils';
import { paiseToMoney, moneyToPaise } from '@vyora/utils';
import { Save, User, MapPin, LayoutDashboard, IndianRupee, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, useWatch, SubmitHandler, Resolver } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface SupplierFormProps {
  initialData?: CreateSupplierInput & { id?: string; supplierCode?: string };
  isEditMode?: boolean;
}

export function SupplierForm({ initialData, isEditMode = false }: SupplierFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const defaultData = initialData
    ? {
        ...initialData,
        openingBalance: paiseToMoney(initialData.openingBalance),
        creditLimit: paiseToMoney(initialData.creditLimit),
      }
    : {
        name: '',
        contactPerson: '',
        mobile: '',
        alternateMobile: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        pan: '',
        registrationType: 'Unregistered',
        openingBalance: 0,
        openingType: null,
        creditLimit: 0,
        creditDays: 0,
        notes: '',
        isActive: true,
      };

  const methods = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema) as unknown as Resolver<CreateSupplierInput>,
    defaultValues: defaultData as unknown as CreateSupplierInput,
  });

  // Watch for smart extractions
  const gstinValue = useWatch({ control: methods.control, name: 'gstin' });
  const pincodeValue = useWatch({ control: methods.control, name: 'pincode' });
  const openingBalanceValue = useWatch({ control: methods.control, name: 'openingBalance' });

  // Handle Opening Type disabled state
  React.useEffect(() => {
    if (Number(openingBalanceValue) === 0) {
      if (methods.getValues('openingType') !== null) {
        methods.setValue('openingType', null, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      if (!methods.getValues('openingType')) {
        methods.setValue('openingType', 'Cr', { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [openingBalanceValue, methods]);

  // Auto-extract PAN & State from GSTIN
  React.useEffect(() => {
    if (gstinValue && gstinValue.length === 15) {
      const pan = extractPanFromGstin(gstinValue);
      if (pan && !methods.getValues('pan')) {
        methods.setValue('pan', pan, { shouldValidate: true, shouldDirty: true });
      }

      const stateCode = extractStateCodeFromGstin(gstinValue);
      if (stateCode && !methods.getValues('state')) {
        methods.setValue('state', stateCode, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [gstinValue, methods]);

  // Smart Pincode Lookup
  React.useEffect(() => {
    if (pincodeValue && /^[1-9][0-9]{5}$/.test(pincodeValue)) {
      const lookup = async () => {
        try {
          if (window.vyora?.directories?.pincode) {
            const res = await window.vyora.directories.pincode.smartLookup(pincodeValue);
            if (res && res.offices && res.offices.length > 0) {
              const office = res.offices[0];

              if (!methods.getValues('city') && office.district) {
                methods.setValue('city', office.district, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              if (!methods.getValues('state') && office.stateName) {
                methods.setValue('state', office.stateName, {
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
  }, [pincodeValue, methods]);

  const onSubmit: SubmitHandler<CreateSupplierInput> = async (data) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      // Clean payload for API
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === '' ? null : val]),
      ) as unknown as CreateSupplierInput;

      const payload = {
        ...cleanedData,
        openingBalance: moneyToPaise(cleanedData.openingBalance as unknown as number),
        creditLimit: moneyToPaise(cleanedData.creditLimit as unknown as number),
      };

      if (isEditMode && initialData?.id) {
        const res = await window.vyora.db.suppliers.update(initialData.id, payload);
        if (res.success) {
          router.push('/dashboard/suppliers');
          router.refresh();
        } else {
          setErrorMsg(res.error || 'Failed to update supplier.');
        }
      } else {
        const res = await window.vyora.db.suppliers.create(payload);
        if (res.success) {
          router.push('/dashboard/suppliers');
          router.refresh();
        } else {
          setErrorMsg(res.error || 'Failed to create supplier.');
        }
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (methods.formState.isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) return;
    }
    router.back();
  };

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        {errorMsg && (
          <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}
        <div className="flex items-start justify-between">
          <SectionHeader
            title={isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
            description="Manage supplier details, addresses, and accounting information."
          />
          {isEditMode && initialData?.supplierCode && (
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                Supplier Code
              </span>
              <span className="text-sm font-bold">{initialData.supplierCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(
              onSubmit as unknown as SubmitHandler<Record<string, unknown>>,
            )}
            className="mx-auto flex w-full max-w-4xl flex-col gap-6"
            id="supplier-form"
          >
            {/* Basic Information */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <User className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="name" label="Supplier Name *">
                  <FormInput name="name" type="text" placeholder="e.g. Acme Corp" />
                </AppField>
                <AppField name="contactPerson" label="Contact Person">
                  <FormInput name="contactPerson" type="text" placeholder="John Doe" />
                </AppField>
                <AppField name="mobile" label="Mobile">
                  <FormInput name="mobile" type="tel" placeholder="9999999999" />
                </AppField>
                <AppField name="alternateMobile" label="Alternate Mobile">
                  <FormInput name="alternateMobile" type="tel" placeholder="8888888888" />
                </AppField>
                <AppField name="email" label="Email">
                  <FormInput name="email" type="email" placeholder="john@acme.com" />
                </AppField>
              </div>
            </AppCard>

            {/* Address */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <MapPin className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">Address</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <AppField name="addressLine1" label="Address Line 1">
                  <FormInput
                    name="addressLine1"
                    type="text"
                    placeholder="Flat / House No. / Building"
                  />
                </AppField>
                <AppField name="addressLine2" label="Address Line 2">
                  <FormInput name="addressLine2" type="text" placeholder="Street / Locality" />
                </AppField>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <AppField name="area" label="Area">
                    <FormInput name="area" type="text" />
                  </AppField>
                  <AppField name="pincode" label="PIN Code">
                    <FormInput name="pincode" type="text" placeholder="6 Digits" maxLength={6} />
                  </AppField>
                  <AppField name="city" label="City">
                    <FormInput name="city" type="text" />
                  </AppField>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="state" label="State">
                    <FormInput
                      name="state"
                      type="text"
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-filled"
                    />
                  </AppField>
                </div>
              </div>
            </AppCard>

            {/* GST & Compliance */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <LayoutDashboard className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  GST & Compliance
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="gstin" label="GSTIN">
                  <FormInput
                    name="gstin"
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    className="uppercase"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Auto-fills PAN and State.</p>
                </AppField>
                <AppField name="pan" label="PAN">
                  <FormInput
                    name="pan"
                    type="text"
                    placeholder="AAAAA0000A"
                    className="uppercase"
                  />
                </AppField>
                <AppField name="registrationType" label="Registration Type">
                  <select
                    {...methods.register('registrationType')}
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Unregistered">Unregistered</option>
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                    <option value="Overseas">Overseas</option>
                    <option value="SEZ">SEZ</option>
                  </select>
                </AppField>
              </div>
            </AppCard>

            {/* Accounting */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <IndianRupee className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">Accounting</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="openingBalance" label="Opening Balance">
                  <FormInput name="openingBalance" type="number" step="0.01" />
                </AppField>
                <AppField name="openingType" label="Opening Type (Dr/Cr)">
                  <select
                    {...methods.register('openingType')}
                    disabled={Number(openingBalanceValue) === 0}
                    className="border-input focus-visible:ring-ring disabled:bg-muted flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- None --</option>
                    <option value="Dr">Dr (Receivable)</option>
                    <option value="Cr">Cr (Payable)</option>
                  </select>
                </AppField>
                <AppField name="creditLimit" label="Credit Limit">
                  <FormInput name="creditLimit" type="number" step="0.01" placeholder="0.00" />
                </AppField>
                <AppField name="creditDays" label="Credit Days">
                  <FormInput name="creditDays" type="number" placeholder="0" />
                </AppField>
              </div>
            </AppCard>

            {/* Additional Info */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <FileText className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Additional Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <AppField name="notes" label="Notes">
                  <textarea
                    {...methods.register('notes')}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any specific instructions or remarks..."
                  />
                </AppField>
                <AppField name="isActive" label="Supplier Status">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...methods.register('isActive')}
                      id="isActive"
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm">
                      Active Supplier
                    </label>
                  </div>
                </AppField>
              </div>
            </AppCard>
          </form>
        </FormProvider>
      </div>

      {/* Footer / Action Bar */}
      <div className="bg-background border-border z-10 shrink-0 border-t p-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {methods.formState.isDirty && (
              <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="outline" type="button" onClick={handleCancel}>
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              form="supplier-form"
              disabled={isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Supplier'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
