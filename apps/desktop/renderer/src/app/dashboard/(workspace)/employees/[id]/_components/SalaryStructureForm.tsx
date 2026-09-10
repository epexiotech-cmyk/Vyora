'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSalaryStructureInput, SalaryComponentDto } from '@vyora/types';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';

const lineSchema = z.object({
  salaryComponentId: z.string().min(1, 'Component is required'),
  amount: z.number().min(0, 'Must be non-negative'),
  percentage: z.number().nullable().optional(),
});

const schema = z.object({
  employeeId: z.string().min(1),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  lines: z.array(lineSchema).min(1, 'At least one component is required'),
});

type FormValues = z.infer<typeof schema>;

interface SalaryStructureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSalaryStructureInput) => Promise<void>;
  employeeId: string;
  activeComponents: SalaryComponentDto[];
}

export function SalaryStructureForm({
  isOpen,
  onClose,
  onSubmit,
  employeeId,
  activeComponents,
}: SalaryStructureFormProps) {
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId,
      effectiveFrom: new Date().toISOString().split('T')[0],
      lines: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'lines',
  });

  const watchLines = useWatch({
    control: methods.control,
    name: 'lines',
  });

  React.useEffect(() => {
    if (isOpen) {
      methods.reset({
        employeeId,
        effectiveFrom: new Date().toISOString().split('T')[0],
        lines: [],
      });
    }
  }, [isOpen, employeeId, methods]);

  const handleSubmit = async (data: FormValues) => {
    // Check for duplicates manually
    const componentIds = new Set(data.lines.map((l) => l.salaryComponentId));
    if (componentIds.size !== data.lines.length) {
      methods.setError('root', { message: 'Duplicate components are not allowed' });
      return;
    }

    const payload: CreateSalaryStructureInput = {
      employeeId: data.employeeId,
      effectiveFrom: new Date(data.effectiveFrom),
      lines: data.lines.map((l, index) => ({
        salaryComponentId: l.salaryComponentId,
        amount: Math.round(l.amount * 100), // convert to paise
        percentage: l.percentage ? l.percentage : null,
        displayOrder: index + 1,
      })),
    };
    await onSubmit(payload);
  };

  const componentOptions = activeComponents.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.category})`,
  }));

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="New Salary Structure">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          {methods.formState.errors.root && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {methods.formState.errors.root.message}
            </div>
          )}

          <AppField name="effectiveFrom" label="Effective From">
            <FormInput name="effectiveFrom" type="date" />
          </AppField>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Salary Components</h3>
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    salaryComponentId: '',
                    amount: 0,
                    percentage: null,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Component
              </AppButton>
            </div>

            {methods.formState.errors.lines?.root && (
              <div className="text-sm text-red-500">
                {methods.formState.errors.lines.root.message}
              </div>
            )}

            {fields.length === 0 && (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No components added yet.
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedComponentId = watchLines[index]?.salaryComponentId;
                const componentDef = activeComponents.find((c) => c.id === selectedComponentId);
                const isPercentage = componentDef?.calculationType === 'Percentage';

                return (
                  <div
                    key={field.id}
                    className="relative flex items-start gap-3 rounded border p-3"
                  >
                    <div className="flex-1 space-y-3">
                      <AppField name={`lines.${index}.salaryComponentId`} label="Component">
                        <FormSelect
                          name={`lines.${index}.salaryComponentId`}
                          options={componentOptions}
                        />
                      </AppField>

                      <div className="grid grid-cols-2 gap-3">
                        <AppField name={`lines.${index}.amount`} label="Fixed Amount (₹)">
                          <FormInput name={`lines.${index}.amount`} type="number" step="0.01" />
                        </AppField>
                        {isPercentage && (
                          <AppField name={`lines.${index}.percentage`} label="Percentage (%)">
                            <FormInput
                              name={`lines.${index}.percentage`}
                              type="number"
                              step="0.01"
                            />
                          </AppField>
                        )}
                      </div>
                      {componentDef?.calculationBase === 'SpecificComponent' &&
                        componentDef.baseComponentId && (
                          <div className="text-muted-foreground text-xs">
                            Base Component ID: {componentDef.baseComponentId}
                          </div>
                        )}
                    </div>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AppButton>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <AppButton
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={methods.formState.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting ? 'Saving...' : 'Save Structure'}
            </AppButton>
          </div>
        </form>
      </FormProvider>
    </AppModal>
  );
}
