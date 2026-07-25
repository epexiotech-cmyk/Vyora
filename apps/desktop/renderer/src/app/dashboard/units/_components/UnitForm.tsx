'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUnitInput, createUnitSchema, UnitDto } from '@vyora/types';
import { GST_UQC_MASTER } from '@vyora/utils';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface UnitFormProps {
  initialData?: UnitDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnitForm({ initialData, onClose, onSuccess }: UnitFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const methods = useForm<CreateUnitInput>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: initialData || {
      name: '',
      shortName: '',
      uqcCode: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateUnitInput) => {
    try {
      setIsSaving(true);
      const payload = {
        ...data,
        uqcCode: data.uqcCode || null,
      };

      if (initialData?.id) {
        const res = await window.vyora.db.units.update(initialData.id, payload);
        if (res.success) {
          toast.success('Unit updated successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to update unit');
        }
      } else {
        const res = await window.vyora.db.units.create(payload);
        if (res.success) {
          toast.success('Unit created successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to create unit');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Quick Select Standard Unit</label>
          <select
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const parts = val.split('-');
              const categoryIdx = parts[1];
              const unitIdx = parts[2];
              if (categoryIdx !== undefined && unitIdx !== undefined) {
                const unit = GST_UQC_MASTER[Number(categoryIdx)]?.units[Number(unitIdx)];
                if (unit) {
                  methods.setValue('name', unit.name, { shouldValidate: true });
                  methods.setValue('shortName', unit.shortName, { shouldValidate: true });
                  methods.setValue('uqcCode', `${unit.uqcCode}-${unit.uqcDescription}`, {
                    shouldValidate: true,
                  });
                }
              }
            }}
            defaultValue=""
          >
            <option value="">Create Custom Unit...</option>
            {GST_UQC_MASTER.map((cat, cIdx) => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.units.map((u, uIdx) => (
                  <option key={u.shortName} value={`std-${cIdx}-${uIdx}`}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <AppField name="name" label="Unit Name *">
          <FormInput name="name" placeholder="e.g. Kilogram" autoFocus />
        </AppField>
        <AppField name="shortName" label="Short Name *">
          <FormInput name="shortName" placeholder="e.g. KGS" />
        </AppField>
        <AppField name="uqcCode" label="UQC Code">
          <FormInput name="uqcCode" placeholder="e.g. KGS-KILOGRAMS" />
        </AppField>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            {...methods.register('isActive')}
            id="isActive"
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm">
            Active Unit
          </label>
        </div>

        <div className="flex flex-col-reverse pt-4 sm:flex-row sm:justify-end sm:space-x-2">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Unit'}
          </AppButton>
        </div>
      </form>
    </FormProvider>
  );
}
