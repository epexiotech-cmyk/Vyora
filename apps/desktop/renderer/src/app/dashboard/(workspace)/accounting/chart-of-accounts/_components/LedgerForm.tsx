'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateLedgerInput,
  createLedgerSchema,
  LedgerDto,
  LedgerGroupDto,
  LedgerOpeningTypeEnum,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

interface LedgerFormProps {
  initialData?: LedgerDto | null;
  groups: LedgerGroupDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LedgerForm({ initialData, groups, onClose, onSuccess }: LedgerFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  // Convert paise to rupees for display
  const initialRupees = initialData ? initialData.openingBalance / 100 : 0;

  type LedgerFormValues = z.infer<typeof createLedgerSchema>;

  const methods = useForm<LedgerFormValues>({
    resolver: zodResolver(createLedgerSchema),
    defaultValues: {
      name: initialData?.name || '',
      groupId: initialData?.groupId || '',
      openingBalance: initialRupees,
      openingType: initialData?.openingType || 'Dr',
      notes: initialData?.notes || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (data: LedgerFormValues) => {
    try {
      setIsSaving(true);

      // Convert rupees to paise
      const payload: CreateLedgerInput = {
        ...data,
        openingBalance: Math.round((data.openingBalance || 0) * 100),
      };

      if (initialData?.id) {
        const res = await window.vyora.accounting.ledgers.update(initialData.id, payload);
        if (res.success) {
          toast.success('Ledger updated successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to update ledger');
        }
      } else {
        const res = await window.vyora.accounting.ledgers.create(payload);
        if (res.success) {
          toast.success('Ledger created successfully');
          onSuccess();
        } else {
          toast.error(res.error || 'Failed to create ledger');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const isProtected =
    initialData?.isSystemAccount ||
    initialData?.referenceType === 'CUSTOMER' ||
    initialData?.referenceType === 'SUPPLIER' ||
    initialData?.isFrozen;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
        <AppField name="name" label="Ledger Name *">
          <FormInput
            name="name"
            placeholder="e.g. HDFC Bank Account"
            autoFocus
            disabled={isProtected}
          />
        </AppField>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Group *</label>
          <select
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...methods.register('groupId')}
            disabled={isProtected}
          >
            <option value="">Select a Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.nature})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <AppField name="openingBalance" label="Opening Balance (₹)">
              <FormInput
                name="openingBalance"
                type="number"
                step="0.01"
                min="0"
                disabled={isProtected}
              />
            </AppField>
          </div>
          <div className="flex w-32 flex-col gap-1.5">
            <label className="text-sm font-medium">Type</label>
            <select
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...methods.register('openingType')}
              disabled={isProtected}
            >
              {LedgerOpeningTypeEnum.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AppField name="notes" label="Notes">
          <FormInput name="notes" placeholder="Optional notes" disabled={isProtected} />
        </AppField>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            {...methods.register('isActive')}
            id="isActive"
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
            disabled={isProtected}
          />
          <label htmlFor="isActive" className="text-sm">
            Active Ledger
          </label>
        </div>

        <div className="flex flex-col-reverse pt-4 sm:flex-row sm:justify-end sm:space-x-2">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          {!isProtected && (
            <AppButton type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Ledger'}
            </AppButton>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
