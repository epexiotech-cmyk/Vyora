'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCompanyProfileRequest } from '@vyora/types';
import { extractPanFromGstin, extractStateCodeFromGstin } from '@vyora/utils';
import {
  Save,
  Building2,
  LayoutDashboard,
  MapPin,
  Phone,
  IndianRupee,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';

import { CompanyLogoUpload } from './CompanyLogoUpload';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  companyProfileSchema,
  CompanyProfileFormValues,
} from '@/lib/validations/companyProfileSchema';

const CONSTITUTION_OPTIONS = [
  { value: '', label: 'Select Constitution Type' },
  { value: 'GOVERNMENT_DEPARTMENT', label: 'Government Department' },
  { value: 'HUF', label: 'Hindu Undivided Family (HUF)' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited Company' },
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited Company' },
  { value: 'SOCIETY_CLUB_TRUST_AOP', label: 'Society / Club / Trust / AOP' },
  { value: 'OTHER', label: 'Other' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: '', label: 'Select Business Type' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'E_COMMERCE', label: 'E-Commerce' },
  { value: 'EDUCATIONAL_INSTITUTION', label: 'Educational Institution' },
  { value: 'EXPORTER', label: 'Exporter' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'IMPORTER', label: 'Importer' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'TRANSPORTER', label: 'Transporter' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'OTHER', label: 'Other' },
];

export function CompanyProfileShell() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [isTradeNameSameAsLegalName, setIsTradeNameSameAsLegalName] = React.useState(false);
  const [currencies, setCurrencies] = React.useState<{ value: string; label: string }[]>([]);
  const { refreshContext } = useCompanyContext();
  const router = useRouter();

  const methods = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      legalName: '',
      tradeName: '',
      gstin: '',
      pan: '',
      constitutionType: '',
      constitutionTypeOther: '',
      businessType: '',
      businessTypeOther: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      stateCode: '',
      countryCode: 'IN', // Default to India for now
      pincode: '',
      email: '',
      mobile: '',
      telephone: '',
      website: '',
      currency: '',
      defaultUpiId: '',
      upiPayeeName: '',
      showQrOnInvoice: false,
      showBankDetailsOnInvoice: false,
    },
    mode: 'onTouched',
  });

  // Watch for smart extractions and conditional fields
  const legalNameValue = useWatch({ control: methods.control, name: 'legalName' });
  const gstinValue = useWatch({ control: methods.control, name: 'gstin' });
  const pincodeValue = useWatch({ control: methods.control, name: 'pincode' });
  const selectedConstitution = useWatch({ control: methods.control, name: 'constitutionType' });
  const selectedBusinessType = useWatch({ control: methods.control, name: 'businessType' });

  // Sync tradeName with legalName if 'Same as Legal Name' is checked
  React.useEffect(() => {
    if (isTradeNameSameAsLegalName) {
      methods.setValue('tradeName', legalNameValue || '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [legalNameValue, isTradeNameSameAsLegalName, methods]);

  // Auto-extract PAN & State from GSTIN
  React.useEffect(() => {
    if (gstinValue && gstinValue.length === 15) {
      const pan = extractPanFromGstin(gstinValue);
      if (pan && !methods.getValues('pan')) {
        methods.setValue('pan', pan, { shouldValidate: true, shouldDirty: true });
      }

      const stateCode = extractStateCodeFromGstin(gstinValue);
      if (stateCode && !methods.getValues('stateCode')) {
        methods.setValue('stateCode', stateCode, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [gstinValue, methods]);

  // Smart Pincode Lookup
  React.useEffect(() => {
    if (pincodeValue && /^[1-9][0-9]{5}$/.test(pincodeValue)) {
      // Async lookup
      const lookup = async () => {
        try {
          const res = await window.vyora.directories.pincode.smartLookup(pincodeValue);
          if (res && res.offices && res.offices.length > 0) {
            const office = res.offices[0];

            // Auto-fill if empty
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
            // Realistically we'd map stateName to stateCode here, but for now we fall back to stateName
            // if we can't find it. Since stateCode is a 2-digit number in GST, we'll try to leave it for now
            // or if we have a mapper we can use it.
          }
        } catch (err) {
          console.warn('Smart pincode lookup failed in UI', err);
        }
      };
      lookup();
    }
  }, [pincodeValue, methods]);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const activeRes = await window.vyora.company.getActive();
        if (activeRes.success && activeRes.data) {
          setCompanyId(activeRes.data);

          // Load currencies
          try {
            const curRes = await window.vyora.directories.currency.getActive();
            if (curRes.success && curRes.data) {
              setCurrencies(
                curRes.data.map((c) => ({
                  value: c.currencyCode,
                  label: `${c.currencyCode} (${c.currencyName})`,
                })),
              );
            }
          } catch (e) {
            console.error('Failed to load currencies', e);
          }

          const profileRes = await window.vyora.company.getProfile(activeRes.data);
          const contextRes = await window.vyora.company.getContext();

          if (profileRes.success && profileRes.data) {
            const profile = profileRes.data;
            const isStandardConstitution =
              !profile.constitutionType ||
              CONSTITUTION_OPTIONS.some((o) => o.value === profile.constitutionType);
            const mappedConstitution = isStandardConstitution
              ? profile.constitutionType || ''
              : 'OTHER';
            const constitutionOther = isStandardConstitution ? '' : profile.constitutionType;

            const isStandardBusiness =
              !profile.businessType ||
              BUSINESS_TYPE_OPTIONS.some((o) => o.value === profile.businessType);
            const mappedBusiness = isStandardBusiness ? profile.businessType || '' : 'OTHER';
            const businessOther = isStandardBusiness ? '' : profile.businessType;

            methods.reset({
              legalName: profile.legalName || '',
              tradeName: profile.tradeName || '',
              gstin: profile.gstin || '',
              pan: profile.pan || '',
              constitutionType: mappedConstitution,
              constitutionTypeOther: constitutionOther,
              businessType: mappedBusiness,
              businessTypeOther: businessOther,
              addressLine1: profile.addressLine1 || '',
              addressLine2: profile.addressLine2 || '',
              city: profile.city || '',
              district: profile.district || '',
              stateCode: profile.stateCode || '',
              countryCode: profile.countryCode || 'IN',
              pincode: profile.pincode || '',
              email: profile.email || '',
              mobile: profile.mobile || '',
              telephone: profile.telephone || '',
              website: profile.website || '',
              currency:
                contextRes.success && contextRes.data?.currency?.currencyCode
                  ? contextRes.data.currency.currencyCode
                  : '',
              defaultUpiId: profile.defaultUpiId || '',
              upiPayeeName: profile.upiPayeeName || '',
              showQrOnInvoice: profile.showQrOnInvoice || false,
              showBankDetailsOnInvoice: profile.showBankDetailsOnInvoice || false,
            });

            // If tradeName matches legalName, check the box automatically
            if (profile.legalName && profile.tradeName === profile.legalName) {
              setIsTradeNameSameAsLegalName(true);
            } else {
              setIsTradeNameSameAsLegalName(false);
            }
          }
        } else {
          setErrorMsg('No active company found.');
        }
      } catch (err) {
        setErrorMsg('Failed to load company profile.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [methods]);

  const onSubmit = async (data: CompanyProfileFormValues) => {
    if (!companyId) return;

    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Clean up empty strings to nulls for the payload
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === '' ? null : val]),
      ) as Record<string, unknown>;

      if (cleanedData.constitutionType === 'OTHER') {
        cleanedData.constitutionType = cleanedData.constitutionTypeOther || 'OTHER';
      }
      delete cleanedData.constitutionTypeOther;

      if (cleanedData.businessType === 'OTHER') {
        cleanedData.businessType = cleanedData.businessTypeOther || 'OTHER';
      }
      delete cleanedData.businessTypeOther;

      const payload: UpdateCompanyProfileRequest = cleanedData as UpdateCompanyProfileRequest;

      const res = await window.vyora.company.updateProfile(companyId, payload);
      if (res.success) {
        setSuccessMsg('Company Profile updated successfully.');
        methods.reset(data); // Reset form state to clear dirty flags
        await refreshContext();
      } else {
        setErrorMsg(res.error || 'Failed to update company profile.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground animate-pulse text-sm">Loading Company Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4">
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
        <div className="mb-2 flex items-center gap-4">
          <AppButton variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </AppButton>
          <SectionHeader
            title="Company GST Profile"
            description="Manage your business information, GST details, and contact information."
          />
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="mx-auto flex w-full max-w-4xl flex-col gap-6"
            id="company-profile-form"
          >
            <CompanyLogoUpload />

            {/* Business Information */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <Building2 className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Business Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="legalName" label="Legal Name *">
                  <FormInput name="legalName" type="text" placeholder="As per PAN" />
                </AppField>
                <div className="flex flex-col gap-2">
                  <AppField name="tradeName" label="Trade Name">
                    <FormInput
                      name="tradeName"
                      type="text"
                      placeholder="If different from legal name"
                      disabled={isTradeNameSameAsLegalName}
                    />
                  </AppField>
                  <label className="text-muted-foreground mt-1 flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="border-primary ring-offset-background focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      checked={isTradeNameSameAsLegalName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsTradeNameSameAsLegalName(checked);
                        if (checked) {
                          methods.setValue('tradeName', methods.getValues('legalName'), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        } else {
                          methods.setValue('tradeName', '', {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                    Same as Legal Name
                  </label>
                </div>
                <div className="flex flex-col gap-4">
                  <AppField name="constitutionType" label="Constitution Type">
                    <FormSelect name="constitutionType" options={CONSTITUTION_OPTIONS} />
                  </AppField>
                  {selectedConstitution === 'OTHER' && (
                    <AppField name="constitutionTypeOther" label="Please Specify">
                      <FormInput
                        name="constitutionTypeOther"
                        type="text"
                        placeholder="Specify Constitution Type"
                      />
                    </AppField>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <AppField name="businessType" label="Business Type">
                    <FormSelect name="businessType" options={BUSINESS_TYPE_OPTIONS} />
                  </AppField>
                  {selectedBusinessType === 'OTHER' && (
                    <AppField name="businessTypeOther" label="Please Specify">
                      <FormInput
                        name="businessTypeOther"
                        type="text"
                        placeholder="Specify Business Type"
                      />
                    </AppField>
                  )}
                </div>
              </div>
            </AppCard>

            {/* GST & Taxation */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <LayoutDashboard className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  GST & Taxation
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
                  <p className="text-muted-foreground mt-1 text-xs">
                    Entering GSTIN will auto-fill PAN and State Code.
                  </p>
                </AppField>
                <AppField name="pan" label="PAN">
                  <FormInput
                    name="pan"
                    type="text"
                    placeholder="AAAAA0000A"
                    className="uppercase"
                  />
                </AppField>
              </div>
            </AppCard>

            {/* Registered Address */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <MapPin className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Registered Address
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <AppField name="addressLine1" label="Address Line 1">
                  <FormInput
                    name="addressLine1"
                    type="text"
                    placeholder="Flat / House No. / Floor / Building"
                  />
                </AppField>
                <AppField name="addressLine2" label="Address Line 2">
                  <FormInput
                    name="addressLine2"
                    type="text"
                    placeholder="Colony / Street / Locality"
                  />
                </AppField>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <AppField name="city" label="City / Town / Village">
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
                  <AppField name="stateCode" label="State Code">
                    <FormInput name="stateCode" type="text" placeholder="e.g. 27" />
                  </AppField>
                  <AppField name="countryCode" label="Country">
                    <FormInput
                      name="countryCode"
                      type="text"
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </AppField>
                </div>
              </div>
            </AppCard>

            {/* Contact Details */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <Phone className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Contact Details
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="email" label="Email Address">
                  <FormInput name="email" type="email" placeholder="hello@company.com" />
                </AppField>
                <AppField name="mobile" label="Mobile Number">
                  <FormInput name="mobile" type="tel" placeholder="+91 9999999999" />
                </AppField>
                <AppField name="telephone" label="Telephone">
                  <FormInput name="telephone" type="tel" placeholder="022-12345678" />
                </AppField>
                <AppField name="website" label="Website">
                  <FormInput name="website" type="url" placeholder="https://www.company.com" />
                </AppField>
              </div>
            </AppCard>

            {/* Payment & Invoice Information */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <QrCode className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Payment & Invoice Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="defaultUpiId" label="Default UPI ID">
                  <FormInput name="defaultUpiId" type="text" placeholder="company@bank" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    This UPI ID will be used to generate the QR code on your invoices.
                  </p>
                </AppField>
                <AppField name="upiPayeeName" label="UPI Payee Name">
                  <FormInput name="upiPayeeName" type="text" placeholder="Company Pvt Ltd" />
                </AppField>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-row items-start space-y-0 space-x-3 p-2">
                  <FormCheckbox name="showQrOnInvoice" className="mt-1" />
                  <div className="space-y-1">
                    <label
                      htmlFor="showQrOnInvoice"
                      className="text-foreground text-sm leading-none font-medium"
                    >
                      Show UPI QR Code on Invoice
                    </label>
                    <p className="text-muted-foreground text-xs">
                      A scannable QR code will be printed on the generated invoice.
                    </p>
                  </div>
                </div>

                <div className="flex flex-row items-start space-y-0 space-x-3 p-2">
                  <FormCheckbox name="showBankDetailsOnInvoice" className="mt-1" />
                  <div className="space-y-1">
                    <label
                      htmlFor="showBankDetailsOnInvoice"
                      className="text-foreground text-sm leading-none font-medium"
                    >
                      Show Bank Details on Invoice
                    </label>
                    <p className="text-muted-foreground text-xs">
                      Your default bank account details will be printed on the invoice.
                    </p>
                  </div>
                </div>
              </div>
            </AppCard>

            {/* Billing Preferences */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <IndianRupee className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Billing Preferences
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="currency" label="Base Currency">
                  <FormSelect
                    name="currency"
                    options={[{ value: '', label: 'Select Currency' }, ...currencies]}
                  />
                </AppField>
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-medium">
                    Current Financial Year
                  </label>
                  <div className="bg-muted border-input flex h-9 w-full items-center rounded-md border px-3 text-sm text-gray-500">
                    Managed in Financial Years Settings
                  </div>
                </div>
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
            <AppButton
              type="submit"
              form="company-profile-form"
              disabled={isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
