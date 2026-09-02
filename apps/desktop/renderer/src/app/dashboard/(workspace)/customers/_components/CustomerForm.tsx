'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCustomerInput, PaymentAccountDto } from '@vyora/types';
import { extractPanFromGstin, getStateFromGstin, isValidGstin } from '@vyora/utils';
import { paiseToMoney, moneyToPaise } from '@vyora/utils';
import {
  Save,
  User,
  MapPin,
  LayoutDashboard,
  IndianRupee,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  useForm,
  FormProvider,
  useWatch,
  SubmitHandler,
  Resolver,
  useFieldArray,
} from 'react-hook-form';

import { AppEmailInput } from '@/components/forms/AppEmailInput';
import { AppField } from '@/components/forms/AppField';
import { AppFormPhoneInput } from '@/components/forms/AppFormPhoneInput';
import { AppGstinInput } from '@/components/forms/AppGstinInput';
import { AppPanInput } from '@/components/forms/AppPanInput';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { customerSchema, CustomerFormValues } from '@/lib/validations/customerSchema';

interface CustomerFormProps {
  initialData?: CustomerFormValues & { id?: string; customerCode?: string };
  isEditMode?: boolean;
}

export function CustomerForm({ initialData, isEditMode = false }: CustomerFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<{
    customerCode: string;
    name: string;
  } | null>(null);
  const [customerType, setCustomerType] = React.useState<'INDIVIDUAL' | 'ENTITY'>('ENTITY');

  const [paymentAccountsList, setPaymentAccountsList] = React.useState<PaymentAccountDto[]>([]);
  const { context } = useCompanyContext();
  const signaturesList = React.useMemo(
    () => context?.company?.signatures || [],
    [context?.company?.signatures],
  );

  const bankAccounts = React.useMemo(
    () => paymentAccountsList.filter((acc) => acc.accountType === 'BANK'),
    [paymentAccountsList],
  );
  const upiAccounts = React.useMemo(
    () => paymentAccountsList.filter((acc) => acc.accountType === 'UPI' || acc.qrEnabled),
    [paymentAccountsList],
  );

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (window.vyora?.paymentAccounts) {
          const res = await window.vyora.paymentAccounts.search({ isActive: true });
          setPaymentAccountsList(res);
        }
      } catch (err) {
        console.warn('Failed to load form dependencies', err);
      }
    };
    fetchData();
  }, []);

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
        defaultPaymentAccountId: null,
        defaultQrAccountId: null,
        defaultSignatureId: null,
        notes: '',
        isActive: true,
        shippingAddresses: [],
      };

  const methods = useForm<CustomerFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(customerSchema) as unknown as Resolver<CustomerFormValues>,
    defaultValues: defaultData as unknown as CustomerFormValues,
  });

  React.useEffect(() => {
    if (bankAccounts.length === 1 && !methods.getValues('defaultPaymentAccountId')) {
      methods.setValue('defaultPaymentAccountId', bankAccounts[0].id, { shouldDirty: true });
    }
  }, [bankAccounts, methods]);

  React.useEffect(() => {
    if (upiAccounts.length === 1 && !methods.getValues('defaultQrAccountId')) {
      methods.setValue('defaultQrAccountId', upiAccounts[0].id, { shouldDirty: true });
    }
  }, [upiAccounts, methods]);

  React.useEffect(() => {
    if (signaturesList.length === 1 && !methods.getValues('defaultSignatureId')) {
      methods.setValue('defaultSignatureId', signaturesList[0].id, { shouldDirty: true });
    }
  }, [signaturesList, methods]);

  const {
    fields: shippingFields,
    append: appendShipping,
    remove: removeShipping,
  } = useFieldArray({
    control: methods.control,
    name: 'shippingAddresses',
  });

  // Watch for smart extractions
  const gstinValue = useWatch({ control: methods.control, name: 'gstin' });
  const pincodeValue = useWatch({ control: methods.control, name: 'pincode' });
  const openingBalanceValue = useWatch({ control: methods.control, name: 'openingBalance' });
  const registrationType = useWatch({ control: methods.control, name: 'registrationType' });

  // Watch for dynamic selects
  const defaultPaymentAccountId = useWatch({
    control: methods.control,
    name: 'defaultPaymentAccountId',
  });
  const defaultQrAccountId = useWatch({ control: methods.control, name: 'defaultQrAccountId' });
  const defaultSignatureId = useWatch({ control: methods.control, name: 'defaultSignatureId' });
  const hasValidGstin = isValidGstin(gstinValue);

  // Handle Opening Type disabled state
  React.useEffect(() => {
    if (Number(openingBalanceValue) === 0) {
      if (methods.getValues('openingType') !== null) {
        methods.setValue('openingType', null, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      if (!methods.getValues('openingType')) {
        methods.setValue('openingType', 'Dr', { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [openingBalanceValue, methods]);

  React.useEffect(() => {
    if (hasValidGstin) {
      if (registrationType === 'Unregistered' || !registrationType) {
        methods.setValue('registrationType', 'Regular', { shouldValidate: true });
      }
    } else {
      if (!gstinValue && registrationType !== 'Unregistered') {
        methods.setValue('registrationType', 'Unregistered', { shouldValidate: true });
      }
    }
  }, [hasValidGstin, gstinValue, registrationType, methods]);

  // Auto-extract PAN & State from GSTIN
  React.useEffect(() => {
    if (gstinValue && gstinValue.length === 15) {
      const pan = extractPanFromGstin(gstinValue);
      if (pan && !methods.getValues('pan')) {
        methods.setValue('pan', pan, { shouldValidate: true, shouldDirty: true });
      }

      const stateData = getStateFromGstin(gstinValue);
      if (stateData && !methods.getValues('state')) {
        methods.setValue('state', `${stateData.stateCode}-${stateData.stateName}`, {
          shouldValidate: true,
          shouldDirty: true,
        });
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
              if (!methods.getValues('district') && office.district) {
                methods.setValue('district', office.district, {
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

  const onSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      // Clean payload for API
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === '' ? null : val]),
      ) as unknown as CustomerFormValues;

      const payload = {
        ...cleanedData,
        openingBalance: moneyToPaise(cleanedData.openingBalance as unknown as number),
        creditLimit: moneyToPaise(cleanedData.creditLimit as unknown as number),
        contactPerson: customerType === 'INDIVIDUAL' ? cleanedData.name : cleanedData.contactPerson,
      } as unknown as CreateCustomerInput;

      if (isEditMode && initialData?.id) {
        const res = await window.vyora.db.customers.update(initialData.id, payload);
        if (res.success) {
          router.push('/dashboard/customers');
          router.refresh();
        } else {
          setErrorMsg(res.error || 'Failed to update customer.');
        }
      } else {
        const res = await window.vyora.db.customers.create(payload);
        if (res.success && res.data) {
          setSuccessData({ customerCode: res.data.customerCode, name: res.data.name });
        } else {
          setErrorMsg(res.error || 'Failed to create customer.');
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
            title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
            description="Manage customer details, addresses, and accounting information."
          />
          {isEditMode && initialData?.customerCode && (
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                Customer Code
              </span>
              <span className="text-sm font-bold">{initialData.customerCode}</span>
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
            id="customer-form"
          >
            {/* Basic Information */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <User className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Basic Information
                </h3>
              </div>
              <div className="mb-4 flex items-center gap-6 border-b px-2 pb-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    className="accent-primary h-4 w-4"
                    name="customerType"
                    value="ENTITY"
                    checked={customerType === 'ENTITY'}
                    onChange={() => setCustomerType('ENTITY')}
                  />
                  <span className="text-sm font-medium">Entity</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    className="accent-primary h-4 w-4"
                    name="customerType"
                    value="INDIVIDUAL"
                    checked={customerType === 'INDIVIDUAL'}
                    onChange={() => setCustomerType('INDIVIDUAL')}
                  />
                  <span className="text-sm font-medium">Individual</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField
                  name="name"
                  label={customerType === 'INDIVIDUAL' ? 'Customer Name *' : 'Company/Firm Name'}
                >
                  <FormInput
                    name="name"
                    type="text"
                    placeholder={customerType === 'INDIVIDUAL' ? 'e.g. John Doe' : 'e.g. Acme Corp'}
                    data-testid="customer-name-input"
                  />
                </AppField>
                {customerType === 'ENTITY' && (
                  <AppField name="contactPerson" label="Contact Person">
                    <FormInput name="contactPerson" type="text" placeholder="John Doe" />
                  </AppField>
                )}
                <AppField name="mobile" label="Mobile">
                  <AppFormPhoneInput name="mobile" />
                </AppField>
                <AppField name="alternateMobile" label="Alternate Mobile">
                  <AppFormPhoneInput name="alternateMobile" />
                </AppField>
                <AppField name="landline" label="Landline">
                  <AppFormPhoneInput name="landline" placeholder="e.g. +91 11 2345 6789" />
                </AppField>
                <AppField name="email" label="Email">
                  <AppEmailInput
                    name="email"
                    placeholder="john@acme.com"
                    data-testid="customer-email-input"
                  />
                </AppField>
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
                  <AppGstinInput name="gstin" placeholder="22AAAAA0000A1Z5" />
                  <p className="text-muted-foreground mt-1 text-xs">Auto-fills PAN and State.</p>
                </AppField>
                <AppField name="pan" label="PAN">
                  <AppPanInput name="pan" placeholder="AAAAA0000A" />
                </AppField>
                <AppField name="registrationType" label="Registration Type">
                  <select
                    {...methods.register('registrationType')}
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!hasValidGstin && <option value="Unregistered">Unregistered</option>}
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                    <option value="Consumer">Consumer</option>
                    <option value="Overseas">Overseas</option>
                    <option value="SEZ">SEZ</option>
                  </select>
                </AppField>
              </div>
            </AppCard>

            {/* Address */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Billing Address
                  </h3>
                </div>
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendShipping({
                      careOf: '',
                      mobile: '',
                      addressLine1: '',
                      addressLine2: '',
                      area: '',
                      city: '',
                      district: '',
                      state: '',
                      pincode: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shipping Address
                </AppButton>
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <AppField name="area" label="Area">
                    <FormInput name="area" type="text" />
                  </AppField>
                  <AppField name="city" label="City">
                    <FormInput name="city" type="text" />
                  </AppField>
                  <AppField name="pincode" label="PIN Code">
                    <FormInput name="pincode" type="text" placeholder="6 Digits" maxLength={6} />
                  </AppField>
                  <AppField name="district" label="District">
                    <FormInput name="district" type="text" />
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

              {/* Dynamic Shipping Addresses */}
              {shippingFields.map((field, index) => (
                <div key={field.id} className="relative mt-8 border-t pt-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-primary text-sm font-semibold">
                      Shipping Address {index + 1}
                    </h4>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeShipping(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AppButton>
                  </div>
                  <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <AppField name={`shippingAddresses.${index}.careOf`} label="In Care of (C/o)">
                      <FormInput
                        name={`shippingAddresses.${index}.careOf`}
                        type="text"
                        placeholder="e.g. John Doe"
                      />
                    </AppField>
                    <AppField name={`shippingAddresses.${index}.mobile`} label="Mobile">
                      <AppFormPhoneInput name={`shippingAddresses.${index}.mobile`} />
                    </AppField>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <AppField
                      name={`shippingAddresses.${index}.addressLine1`}
                      label="Address Line 1"
                    >
                      <FormInput
                        name={`shippingAddresses.${index}.addressLine1`}
                        type="text"
                        placeholder="Flat / House No. / Building"
                      />
                    </AppField>
                    <AppField
                      name={`shippingAddresses.${index}.addressLine2`}
                      label="Address Line 2"
                    >
                      <FormInput
                        name={`shippingAddresses.${index}.addressLine2`}
                        type="text"
                        placeholder="Street / Locality"
                      />
                    </AppField>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <AppField name={`shippingAddresses.${index}.area`} label="Area">
                        <FormInput name={`shippingAddresses.${index}.area`} type="text" />
                      </AppField>
                      <AppField name={`shippingAddresses.${index}.city`} label="City">
                        <FormInput name={`shippingAddresses.${index}.city`} type="text" />
                      </AppField>
                      <AppField name={`shippingAddresses.${index}.pincode`} label="PIN Code">
                        <FormInput
                          name={`shippingAddresses.${index}.pincode`}
                          type="text"
                          placeholder="6 Digits"
                          maxLength={6}
                        />
                      </AppField>
                      <AppField name={`shippingAddresses.${index}.district`} label="District">
                        <FormInput name={`shippingAddresses.${index}.district`} type="text" />
                      </AppField>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <AppField name={`shippingAddresses.${index}.state`} label="State">
                        <FormInput name={`shippingAddresses.${index}.state`} type="text" />
                      </AppField>
                    </div>
                  </div>
                </div>
              ))}
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
              {/* Invoice Defaults */}
              <div className="mt-6 border-t pt-6">
                <h4 className="text-foreground mb-4 text-sm font-medium">Invoice Defaults</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <AppField name="defaultPaymentAccountId" label="Default Payment Account">
                    <select
                      {...methods.register('defaultPaymentAccountId')}
                      value={defaultPaymentAccountId || ''}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- None --</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.displayName} - {acc.accountType}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="defaultQrAccountId" label="Default UPI ID">
                    <select
                      {...methods.register('defaultQrAccountId')}
                      value={defaultQrAccountId || ''}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- None --</option>
                      {upiAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.displayName} - {acc.accountType}
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="defaultSignatureId" label="Default Signature">
                    <select
                      {...methods.register('defaultSignatureId')}
                      value={defaultSignatureId || ''}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- None --</option>
                      {signaturesList.map((sig, index) => (
                        <option key={sig.id} value={sig.id}>
                          Signature {index + 1} - {sig.designation}
                        </option>
                      ))}
                    </select>
                  </AppField>
                </div>
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
                <AppField name="isActive" label="Customer Status">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...methods.register('isActive')}
                      id="isActive"
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm">
                      Active Customer
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
              form="customer-form"
              data-testid="save-customer-btn"
              disabled={isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Customer'}
            </AppButton>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-in zoom-in-95 bg-background text-card-foreground w-full max-w-md rounded-lg p-6 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="bg-success/15 text-success mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight">Customer Created!</h2>
              <p className="text-muted-foreground mb-6">
                <span className="text-foreground font-semibold">{successData.name}</span> has been
                successfully registered in the system.
              </p>
              <div className="bg-muted mb-6 w-full rounded-md p-4">
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                  Customer Code
                </p>
                <p className="font-mono text-2xl font-bold tracking-widest">
                  {successData.customerCode}
                </p>
              </div>
              <div className="flex w-full gap-3">
                <AppButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSuccessData(null);
                    methods.reset();
                  }}
                >
                  Create Another
                </AppButton>
                <AppButton className="flex-1" onClick={() => router.push('/dashboard/customers')}>
                  View Customers
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
