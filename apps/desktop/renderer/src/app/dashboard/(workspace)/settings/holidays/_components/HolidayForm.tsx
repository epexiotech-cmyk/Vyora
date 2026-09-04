'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateHolidayInput, createHolidaySchema, HolidayDto } from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface HolidayFormProps {
  initialData?: HolidayDto | null;
  onClose: () => void;
  onSuccess: () => void;
  createFn: (data: CreateHolidayInput) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFn: (id: string, data: any) => Promise<unknown>;
}

export function HolidayForm({
  initialData,
  onClose,
  onSuccess,
  createFn,
  updateFn,
}: HolidayFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const methods = useForm<CreateHolidayInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createHolidaySchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          date: new Date(initialData.date),
          isActive: initialData.isActive,
        }
      : {
          name: '',
          date: new Date(),
          isActive: true,
        },
  });

  const onSubmit = async (data: CreateHolidayInput) => {
    try {
      setIsSaving(true);
      if (initialData?.id) {
        await updateFn(initialData.id, data);
        toast.success('Holiday updated successfully');
      } else {
        await createFn(data);
        toast.success('Holiday created successfully');
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
        <AppField name="name" label="Holiday Name *">
          <FormInput name="name" placeholder="Enter name" autoFocus />
        </AppField>

        <AppField name="date" label="Date *">
          <FormInput name="date" type="date" />
        </AppField>

        <AppField
          name="isActive"
          label="Active"
          description="Inactive records are hidden from selections"
        >
          <FormCheckbox name="isActive" />
        </AppField>

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
