'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductInput, createProductSchema, TaxDto, UnitDto } from '@vyora/types';
import { paiseToMoney, moneyToPaise } from '@vyora/utils';
import { Save, Package, LayoutDashboard, IndianRupee, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface ItemFormProps {
  initialData?: CreateProductInput & { id?: string; sku?: string };
  isEditMode?: boolean;
}

export function ItemForm({ initialData, isEditMode = false }: ItemFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [units, setUnits] = React.useState<UnitDto[]>([]);
  const [taxes, setTaxes] = React.useState<TaxDto[]>([]);
  const [activeCompanyId, setActiveCompanyId] = React.useState<string>('');

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
      }
    };
    fetchDependencies();
  }, []);

  const methods = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as unknown as Resolver<CreateProductInput>,
    defaultValues: initialData
      ? {
          ...initialData,
          salePrice: paiseToMoney(initialData.salePrice),
          purchasePrice: paiseToMoney(initialData.purchasePrice),
        }
      : {
          companyId: '',
          name: '',
          itemType: 'INVENTORY_ITEM',
          description: '',
          hsnCode: '',
          unitId: '',
          taxId: '',
          salePrice: 0,
          purchasePrice: 0,
          stock: 0,
          reorderLevel: 0,
          isActive: true,
        },
  });

  React.useEffect(() => {
    if (activeCompanyId && !methods.getValues('companyId')) {
      methods.setValue('companyId', activeCompanyId);
    }
  }, [activeCompanyId, methods]);

  const onSubmit: SubmitHandler<CreateProductInput> = async (data) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      // Clean payload for API
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === '' ? null : val]),
      ) as unknown as CreateProductInput;

      const payload = {
        ...cleanedData,
        salePrice: moneyToPaise(cleanedData.salePrice as unknown as number),
        purchasePrice: moneyToPaise(cleanedData.purchasePrice as unknown as number),
      };

      if (!payload.companyId && activeCompanyId) {
        payload.companyId = activeCompanyId;
      }

      if (isEditMode && initialData?.id) {
        const updatePayload = {
          ...payload,
          id: initialData.id,
        } as import('@vyora/types').UpdateProductInput;
        const res = await window.vyora.db.products.update(initialData.id, updatePayload);
        if (res.success) {
          router.push('/dashboard/items');
          router.refresh();
        } else {
          setErrorMsg(res.error || 'Failed to update item.');
        }
      } else {
        const res = await window.vyora.db.products.create(payload);
        if (res.success) {
          router.push('/dashboard/items');
          router.refresh();
        } else {
          setErrorMsg(res.error || 'Failed to create item.');
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
            title={isEditMode ? 'Edit Item' : 'Add New Item'}
            description="Manage inventory items, non-inventory products, and services."
          />
          {isEditMode && initialData?.sku && (
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                Item Code (SKU)
              </span>
              <span className="text-sm font-bold">{initialData.sku}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit as SubmitHandler<CreateProductInput>)}
            className="mx-auto flex w-full max-w-4xl flex-col gap-6"
            id="item-form"
          >
            {/* Basic Information */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <Package className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AppField name="name" label="Item Name *">
                  <FormInput name="name" type="text" placeholder="e.g. Wireless Mouse" />
                </AppField>
                <AppField name="itemType" label="Item Type *">
                  <select
                    {...methods.register('itemType')}
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="INVENTORY_ITEM">Inventory Item</option>
                    <option value="NON_INVENTORY_ITEM">Non-Inventory Item</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </AppField>
              </div>
              <div className="mt-6">
                <AppField name="description" label="Description">
                  <textarea
                    {...methods.register('description')}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Provide a detailed description of the item..."
                  />
                </AppField>
              </div>
            </AppCard>

            {/* Classification & Measurement */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <LayoutDashboard className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Classification & Measurement
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <AppField name="hsnCode" label="HSN / SAC Code">
                  <FormInput name="hsnCode" type="text" placeholder="e.g. 8471" />
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
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- Select Tax --</option>
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.rate}%)
                      </option>
                    ))}
                  </select>
                </AppField>
              </div>
            </AppCard>

            {/* Pricing & Inventory */}
            <AppCard className="p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-3">
                <IndianRupee className="text-muted-foreground h-5 w-5" />
                <h3 className="text-foreground text-sm font-semibold tracking-wide">
                  Pricing & Inventory
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <AppField name="salePrice" label="Sales Rate">
                  <FormInput name="salePrice" type="number" step="0.01" />
                </AppField>
                <AppField name="purchasePrice" label="Purchase Rate">
                  <FormInput name="purchasePrice" type="number" step="0.01" />
                </AppField>
                <AppField name="stock" label="Opening Stock">
                  <FormInput name="stock" type="number" />
                </AppField>
                <AppField name="reorderLevel" label="Reorder Level">
                  <FormInput name="reorderLevel" type="number" />
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
                      Active Item
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
              form="item-form"
              disabled={isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Item'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
