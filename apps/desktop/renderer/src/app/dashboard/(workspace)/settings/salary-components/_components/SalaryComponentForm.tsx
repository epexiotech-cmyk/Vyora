'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateSalaryComponentInput,
  createSalaryComponentSchema,
  SalaryComponentDto,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppButton } from '@/components/ui/AppButton';

interface SalaryComponentFormProps {
  initialData?: SalaryComponentDto | null;
  onClose: () => void;
  onSuccess: () => void;
  createFn: (data: CreateSalaryComponentInput) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFn: (id: string, data: any) => Promise<unknown>;
  allComponents: SalaryComponentDto[];
}

export function SalaryComponentForm({
  initialData,
  onClose,
  onSuccess,
  createFn,
  updateFn,
  allComponents,
}: SalaryComponentFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!initialData;

  const methods = useForm<CreateSalaryComponentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSalaryComponentSchema) as any,
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          category: initialData.category,
          calculationType: initialData.calculationType,
          calculationBase: initialData.calculationBase,
          baseComponentId: initialData.baseComponentId,
          defaultAmount: initialData.defaultAmount ? initialData.defaultAmount / 100 : 0,
          defaultPercentage: initialData.defaultPercentage,
          displayOrder: initialData.displayOrder,
          isActive: initialData.isActive,
          isBasic: initialData.isBasic,
          isProrated: initialData.isProrated,
        }
      : {
          code: '',
          name: '',
          category: 'Earning',
          calculationType: 'Fixed',
          calculationBase: null,
          baseComponentId: null,
          defaultAmount: 0,
          defaultPercentage: null,
          displayOrder: 0,
          isActive: true,
          isBasic: false,
          isProrated: true,
        },
  });

  const calculationType = useWatch({
    control: methods.control,
    name: 'calculationType',
  });

  const calculationBase = useWatch({
    control: methods.control,
    name: 'calculationBase',
  });

  const category = useWatch({
    control: methods.control,
    name: 'category',
  });

  React.useEffect(() => {
    if (!isEditing) {
      methods.setValue('isProrated', category === 'Earning');
    }
  }, [category, isEditing, methods]);

  const onSubmit = async (data: CreateSalaryComponentInput) => {
    try {
      setIsSaving(true);
      const dataToSave = {
        ...data,
        defaultAmount: data.defaultAmount ? Math.round(data.defaultAmount * 100) : 0,
      };

      if (initialData?.id) {
        await updateFn(initialData.id, dataToSave);
        toast.success('Salary Component updated successfully');
      } else {
        await createFn(dataToSave);
        toast.success('Salary Component created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <AppField name="code" label="Code *">
            <FormInput name="code" placeholder="e.g. BASIC" disabled={isEditing} autoFocus />
          </AppField>

          <AppField name="name" label="Name *">
            <FormInput name="name" placeholder="e.g. Basic Salary" />
          </AppField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AppField name="category" label="Category *">
            <FormSelect
              name="category"
              options={[
                { label: 'Earning', value: 'Earning' },
                { label: 'Deduction', value: 'Deduction' },
              ]}
            />
          </AppField>

          <AppField name="calculationType" label="Calculation Type *">
            <FormSelect
              name="calculationType"
              options={[
                { label: 'Fixed', value: 'Fixed' },
                { label: 'Percentage', value: 'Percentage' },
              ]}
            />
          </AppField>
        </div>

        {calculationType === 'Percentage' && (
          <div className="grid grid-cols-2 gap-4">
            <AppField name="calculationBase" label="Calculation Base *">
              <FormSelect
                name="calculationBase"
                options={[
                  { label: 'Basic Salary', value: 'Basic' },
                  { label: 'Gross Salary', value: 'Gross' },
                  { label: 'Total Earnings', value: 'TotalEarnings' },
                  { label: 'Specific Component', value: 'SpecificComponent' },
                ]}
              />
            </AppField>

            {calculationBase === 'SpecificComponent' && (
              <AppField name="baseComponentId" label="Base Component *">
                <FormSelect
                  name="baseComponentId"
                  options={allComponents
                    .filter((c) => !isEditing || c.id !== initialData?.id)
                    .map((c) => ({
                      label: `${c.name} (${c.code})`,
                      value: c.id,
                    }))}
                />
              </AppField>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {calculationType === 'Fixed' && (
            <AppField name="defaultAmount" label="Default Amount (₹)">
              <FormInput name="defaultAmount" type="number" step="0.01" />
            </AppField>
          )}

          {calculationType === 'Percentage' && (
            <AppField name="defaultPercentage" label="Default Percentage (%)">
              <FormInput name="defaultPercentage" type="number" step="0.01" />
            </AppField>
          )}

          <AppField name="displayOrder" label="Display Order">
            <FormInput name="displayOrder" type="number" />
          </AppField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AppField
            name="isActive"
            label="Active"
            description="Inactive components are hidden from selections"
          >
            <FormCheckbox name="isActive" />
          </AppField>

          <AppField
            name="isBasic"
            label="Is Basic"
            description="Marks this component as the base for standard calculations (Only 1 active allowed)"
          >
            <FormCheckbox name="isBasic" />
          </AppField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AppField
            name="isProrated"
            label="Prorate with Attendance"
            description="When enabled, this fixed component is adjusted according to payable days."
          >
            <FormCheckbox name="isProrated" disabled={calculationType === 'Percentage'} />
          </AppField>
        </div>

        <div className="flex flex-col-reverse pt-4 sm:flex-row sm:justify-end sm:space-x-2">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </AppButton>
        </div>
      </form>
    </FormProvider>
  );
}
