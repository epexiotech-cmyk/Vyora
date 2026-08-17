'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateLedgerGroupInput,
  createLedgerGroupSchema,
  LedgerGroupDto,
  LedgerGroupNatureEnum,
  LedgerGroupNature,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface LedgerGroupFormProps {
  initialData?: LedgerGroupDto | null;
  groups: LedgerGroupDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LedgerGroupForm({ initialData, groups, onClose, onSuccess }: LedgerGroupFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const methods = useForm<CreateLedgerGroupInput>({
    resolver: zodResolver(createLedgerGroupSchema),
    defaultValues: {
      name: initialData?.name || '',
      parentGroupId: initialData?.parentGroupId || null,
      nature: (initialData?.nature as LedgerGroupNature) || 'Asset',
      isActive: initialData?.isActive ?? true,
    },
  });

  // Derived nature logic: if a parent is selected, the nature must match the parent's nature.
  const parentGroupId = useWatch({
    control: methods.control,
    name: 'parentGroupId',
  });
  React.useEffect(() => {
    if (parentGroupId) {
      const parent = groups.find((g) => g.id === parentGroupId);
      if (parent) {
        methods.setValue('nature', parent.nature as LedgerGroupNature);
      }
    }
  }, [parentGroupId, groups, methods]);

  const onSubmit = async (data: CreateLedgerGroupInput) => {
    try {
      setIsSaving(true);
      if (initialData?.id) {
        const res = await window.vyora.accounting.groups.update(initialData.id, data);
        if (res.success) {
          toast.success('Ledger group updated successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to update ledger group');
        }
      } else {
        const res = await window.vyora.accounting.groups.create(data);
        if (res.success) {
          toast.success('Ledger group created successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to create ledger group');
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
        <AppField name="name" label="Group Name *">
          <FormInput name="name" placeholder="e.g. Current Assets" autoFocus />
        </AppField>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Parent Group</label>
          <select
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...methods.register('parentGroupId')}
          >
            <option value="">None (Top Level)</option>
            {groups
              .filter((g) => g.id !== initialData?.id)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.nature})
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nature *</label>
          <select
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...methods.register('nature')}
            disabled={!!parentGroupId || initialData?.isSystemGroup}
          >
            {LedgerGroupNatureEnum.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {parentGroupId && (
            <p className="text-muted-foreground text-xs">
              Nature is derived from the parent group.
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            {...methods.register('isActive')}
            id="isActive"
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
            disabled={initialData?.isSystemGroup}
          />
          <label htmlFor="isActive" className="text-sm">
            Active Group
          </label>
        </div>

        <div className="flex flex-col-reverse pt-4 sm:flex-row sm:justify-end sm:space-x-2">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Group'}
          </AppButton>
        </div>
      </form>
    </FormProvider>
  );
}
