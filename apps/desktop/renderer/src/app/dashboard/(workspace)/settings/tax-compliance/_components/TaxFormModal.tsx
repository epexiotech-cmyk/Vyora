'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaxInput, TaxDto, UpdateTaxInput } from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider, Resolver, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';

const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  taxType: z.enum(['GST', 'CESS', 'EXEMPT', 'NIL']),
  isActive: z.boolean().default(true),
});

type TaxFormValues = z.infer<typeof taxSchema>;

interface TaxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id?: string) => void;
  initialData?: TaxDto;
  existingTaxes?: TaxDto[];
}

export function TaxFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  existingTaxes = [],
}: TaxFormModalProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const { context } = useCompanyContext();

  const methods = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema) as unknown as Resolver<TaxFormValues>,
    defaultValues: {
      name: '',
      rate: 0,
      taxType: 'GST',
      isActive: true,
    },
  });

  // Reset form when modal opens or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        methods.reset({
          name: initialData.name,
          rate: initialData.rate,
          taxType: initialData.taxType,
          isActive: initialData.isActive,
        });
      } else {
        methods.reset({
          name: '',
          rate: 0,
          taxType: 'GST',
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData, methods]);

  const watchedRate = useWatch({
    control: methods.control,
    name: 'rate',
  });

  const watchedTaxType = useWatch({
    control: methods.control,
    name: 'taxType',
  });

  React.useEffect(() => {
    if (isOpen) {
      const generatedName = `${watchedTaxType} ${watchedRate}%`;
      methods.setValue('name', generatedName, { shouldValidate: true });
    }
  }, [watchedRate, watchedTaxType, isOpen, methods]);

  const onSubmit = async (data: TaxFormValues) => {
    // Check for duplicates if creating a new tax
    if (!initialData) {
      const isDuplicate = existingTaxes.some(
        (tax) => tax.rate === data.rate && tax.taxType === data.taxType,
      );
      if (isDuplicate) {
        toast.error(`A ${data.taxType} rate of ${data.rate}% already exists.`);
        return;
      }
    }

    try {
      setIsSaving(true);

      if (initialData) {
        const payload: UpdateTaxInput = {
          id: initialData.id,
          ...data,
        };
        const res = await window.vyora.db.taxes.update(initialData.id, payload);
        if (res.success) {
          toast.success('GST rate updated successfully');
          onSuccess(res.data?.id);
          onClose();
        } else {
          toast.error(res.error || 'Failed to update GST rate');
        }
      } else {
        const payload: CreateTaxInput = {
          companyId: context?.company.id || '',
          ...data,
        };
        const res = await window.vyora.db.taxes.create(payload);
        if (res.success) {
          toast.success('GST rate added successfully');
          onSuccess(res.data?.id);
          onClose();
        } else {
          toast.error(res.error || 'Failed to add GST rate');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit GST Rate' : 'Add GST Rate'}
      description="Configure tax rates for your items and services."
      hideActions
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AppField name="name" label="Tax Name *">
            <FormInput name="name" placeholder="e.g. GST 18% (18%)" />
          </AppField>

          <div className="grid grid-cols-2 gap-4">
            <AppField name="rate" label="Rate (%) *">
              <FormInput name="rate" type="number" step="0.01" />
            </AppField>

            <AppField name="taxType" label="Tax Type *">
              <select
                {...methods.register('taxType')}
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="GST">GST</option>
                <option value="CESS">CESS</option>
                <option value="EXEMPT">Exempt</option>
                <option value="NIL">Nil Rated</option>
              </select>
            </AppField>
          </div>

          <AppField name="isActive" label="Status">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...methods.register('isActive')}
                id="isActive"
                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm">
                Active
              </label>
            </div>
          </AppField>

          <div className="mt-4 flex justify-end gap-2">
            <AppButton variant="outline" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : initialData ? 'Update Rate' : 'Save Rate'}
            </AppButton>
          </div>
        </form>
      </FormProvider>
    </AppModal>
  );
}
