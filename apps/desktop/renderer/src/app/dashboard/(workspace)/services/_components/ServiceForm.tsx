'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductInput, createProductSchema, TaxDto, UnitDto } from '@vyora/types';
import { Save, Package, LayoutDashboard, IndianRupee, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { TaxFormModal } from '../../settings/tax-compliance/_components/TaxFormModal';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { MoneyInput } from '@/components/forms/MoneyInput';
import { useCurrency } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export interface ServiceFormProps {
  id?: string;
  initialData?: CreateProductInput & { id?: string; sku?: string };
  isEditMode?: boolean;
}

export function ServiceForm({ id, initialData, isEditMode = false }: ServiceFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingDependencies, setIsLoadingDependencies] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [units, setUnits] = React.useState<UnitDto[]>([]);
  const [taxes, setTaxes] = React.useState<TaxDto[]>([]);
  const [activeCompanyId, setActiveCompanyId] = React.useState<string>('');
  const [isTaxModalOpen, setIsTaxModalOpen] = React.useState(false);

  const reloadTaxes = async (newTaxId?: string) => {
    try {
      const taxRes = await window.vyora.db.taxes.getAll();
      if (taxRes.success && taxRes.data) {
        setTaxes(taxRes.data);
        if (newTaxId) {
          methods.setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: true });
        }
      }
    } catch (err) {
      console.error('Failed to reload taxes', err);
    }
  };

  const currency = useCurrency();
  const multiplier = Math.pow(10, currency.decimalPlaces);

  React.useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const companyRes = await window.vyora.company.getActive();
        if (companyRes.success && companyRes.data) {
          setActiveCompanyId(companyRes.data);
        }

        const [unitRes, taxRes] = await Promise.all([
          window.vyora.db.units.getAll(),
          window.vyora.db.taxes.getAll(),
        ]);

        if (unitRes.success && unitRes.data) setUnits(unitRes.data);
        if (taxRes.success && taxRes.data) setTaxes(taxRes.data);
      } catch (err) {
        console.error('Failed to load item dependencies', err);
      } finally {
        setIsLoadingDependencies(false);
      }
    };
    fetchDependencies();
  }, []);

  const methods = useForm<CreateProductInput>({
    resolver: zodResolver(
      createProductSchema.omit({ companyId: true }),
    ) as unknown as Resolver<CreateProductInput>,
    defaultValues: initialData
      ? {
          ...initialData,
          unitId: initialData.unitId || '',
          taxId: initialData.taxId || '',
          salePrice: (initialData.salePrice || 0) / multiplier,
        }
      : {
          companyId: '',
          name: '',
          itemType: 'SERVICE',
          description: '',
          hsnCode: '',
          barcodeValue: '',
          barcodeType: '',
          taxabilityType: 'Taxable',
          unitId: '',
          taxId: '',
          salePrice: 0,
          isActive: true,
        },
  });

  React.useEffect(() => {
    const firstError = Object.keys(methods.formState.errors)[0];
    if (firstError) {
      methods.setFocus(firstError as keyof CreateProductInput);
    }
  }, [methods.formState.errors, methods]);

  React.useEffect(() => {
    if (activeCompanyId && !methods.getValues('companyId')) {
      methods.setValue('companyId', activeCompanyId);
    }
  }, [activeCompanyId, methods]);

  const onSubmit: SubmitHandler<CreateProductInput> = async (data) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      const payload = { ...data, itemType: 'SERVICE' as const };
      if (isEditMode && id) {
        const updatePayload = { ...payload, id };
        const res = await window.vyora.db.products.update(id, updatePayload);
        if (res.success) {
          toast.success('Service updated successfully');
          router.push('/dashboard/services');
        } else {
          setErrorMsg(res.error || 'Failed to update service.');
        }
      } else {
        const res = await window.vyora.db.products.create(payload);
        if (res.success) {
          toast.success('Service created successfully');
          router.push('/dashboard/services');
        } else {
          setErrorMsg(res.error || 'Failed to create service.');
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
      <div className="shrink-0 px-6 pt-6 pb-4">
        {errorMsg && (
          <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}
        <div className="flex items-start justify-between">
          <SectionHeader
            title={isEditMode ? 'Edit Service' : 'Add New Service'}
            description="Manage your services."
          />
          {isEditMode && initialData?.sku && (
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                Service Code
              </span>
              <span className="text-sm font-bold">{initialData.sku}</span>
            </div>
          )}
        </div>
      </div>

      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        {isLoadingDependencies ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-muted-foreground animate-pulse text-sm">Loading dependencies...</p>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit, (errors) => {
                console.error('Validation errors:', errors);
              })}
              className="mx-auto flex w-full max-w-4xl flex-col gap-6"
              id="service-form"
            >
              <input type="hidden" {...methods.register('companyId')} />
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <Package className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Basic Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="name" label="Service Name *">
                    <FormInput
                      name="name"
                      type="text"
                      placeholder="e.g. Web Development"
                      data-testid="service-name-input"
                    />
                  </AppField>
                  <AppField name="itemType" label="Service Type *">
                    <select
                      {...methods.register('itemType')}
                      disabled
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="SERVICE">Service</option>
                    </select>
                  </AppField>
                </div>
                <div className="mt-6">
                  <AppField name="description" label="Description">
                    <textarea
                      {...methods.register('description')}
                      className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Provide a detailed description of the service..."
                    />
                  </AppField>
                </div>
              </AppCard>

              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <LayoutDashboard className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">
                    Classification & Measurement
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <AppField name="hsnCode" label="SAC Code">
                    <FormInput name="hsnCode" type="text" placeholder="e.g. 9983" />
                  </AppField>
                  <AppField name="barcodeValue" label="Barcode">
                    <FormInput name="barcodeValue" type="text" placeholder="e.g. 8901234567890" />
                  </AppField>
                  <AppField name="taxabilityType" label="Taxability Type *">
                    <select
                      {...methods.register('taxabilityType')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Taxable">Taxable</option>
                      <option value="Nil Rated">Nil Rated</option>
                      <option value="Exempt">Exempt</option>
                      <option value="Non-GST">Non-GST</option>
                    </select>
                  </AppField>
                  <AppField name="unitId" label="Unit of Measurement *">
                    <select
                      {...methods.register('unitId')}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Select Unit --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                  </AppField>
                  <AppField name="taxId" label="Tax Bracket *">
                    <select
                      {...methods.register('taxId')}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          e.target.value = methods.getValues('taxId') || '';
                          setIsTaxModalOpen(true);
                        } else {
                          methods.setValue('taxId', e.target.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Select Tax --</option>
                      {taxes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.rate}%)
                        </option>
                      ))}
                      <option value="ADD_NEW" className="text-primary font-semibold">
                        -- Add New Tax --
                      </option>
                    </select>
                  </AppField>
                </div>
              </AppCard>

              {/* Pricing & Inventory */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <IndianRupee className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">Pricing</h3>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <AppField name="salePrice" label="Sales Rate">
                    <MoneyInput name="salePrice" data-testid="item-price-input" />
                  </AppField>
                  <AppField name="purchasePrice" label="Purchase Rate">
                    <MoneyInput name="purchasePrice" />
                  </AppField>
                </div>
              </AppCard>

              {/* Additional Info */}
              <AppCard className="p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 border-b pb-3">
                  <FileText className="text-muted-foreground h-5 w-5" />
                  <h3 className="text-foreground text-sm font-semibold tracking-wide">Settings</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <AppField name="isActive" label="Item Status">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...methods.register('isActive')}
                        id="isActive"
                        className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="isActive" className="text-sm">
                        Active Service
                      </label>
                    </div>
                  </AppField>
                </div>
              </AppCard>
            </form>
          </FormProvider>
        )}
        <TaxFormModal
          isOpen={isTaxModalOpen}
          onClose={() => setIsTaxModalOpen(false)}
          onSuccess={(id) => reloadTaxes(id)}
          existingTaxes={taxes}
        />
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
              form="service-form"
              data-testid="save-service-btn"
              disabled={isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Service'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
