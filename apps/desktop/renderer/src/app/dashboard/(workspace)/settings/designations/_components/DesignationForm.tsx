'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDesignationInput, createDesignationSchema, DesignationDto } from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface DesignationFormProps {
  initialData?: DesignationDto | null;
  onClose: () => void;
  onSuccess: () => void;
  createFn: (data: CreateDesignationInput) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFn: (id: string, data: any) => Promise<unknown>;
}

export function DesignationForm({
  initialData,
  onClose,
  onSuccess,
  createFn,
  updateFn,
}: DesignationFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isSystem = false;
  // const isSystem = false;

  const methods = useForm<CreateDesignationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createDesignationSchema) as any,
    defaultValues: initialData || {
      name: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateDesignationInput) => {
    try {
      setIsSaving(true);
      if (initialData?.id) {
        await updateFn(initialData.id, data);
        toast.success('Designation updated successfully');
      } else {
        await createFn(data);
        toast.success('Designation created successfully');
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
        <AppField name="name" label="Name *">
          <FormInput name="name" placeholder="Enter name" disabled={isSystem} autoFocus />
        </AppField>

        <AppField
          name="isActive"
          label="Active"
          description="Inactive records are hidden from selections"
        >
          <FormCheckbox name="isActive" disabled={isSystem} />
        </AppField>

        <div className="flex flex-col-reverse pt-4 sm:flex-row sm:justify-end sm:space-x-2">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          {!isSystem && (
            <AppButton type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </AppButton>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
