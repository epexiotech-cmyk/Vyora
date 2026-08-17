'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useFieldArray, useForm, FormProvider, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useLedgers } from '../../chart-of-accounts/hooks/useLedgers';
import { useCreateJournalVoucher } from '../hooks/useJournal';

import { JournalSummary } from './JournalSummary';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { AppButton } from '@/components/ui/AppButton';

const JournalEntryFormSchema = z.object({
  voucherDate: z.string().min(1, 'Date is required'),
  narration: z.string().optional(),
  entries: z
    .array(
      z.object({
        ledgerId: z.string().min(1, 'Ledger is required'),
        debitRupees: z.number().min(0),
        creditRupees: z.number().min(0),
        narration: z.string().optional(),
      }),
    )
    .min(2, 'At least two entries are required')
    .refine(
      (entries) => {
        return entries.every((e) => {
          const hasDebit = e.debitRupees > 0;
          const hasCredit = e.creditRupees > 0;
          return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
        });
      },
      { message: 'Each line must have either a debit OR a credit, not both.' },
    ),
});

type JournalFormValues = z.infer<typeof JournalEntryFormSchema>;

export function JournalForm() {
  const router = useRouter();
  const { data: ledgers, fetchLedgers } = useLedgers();

  React.useEffect(() => {
    fetchLedgers({ limit: 1000, isActive: true });
  }, [fetchLedgers]);

  const { mutateAsync: createVoucher, isPending } = useCreateJournalVoucher();

  const methods = useForm<JournalFormValues>({
    resolver: zodResolver(JournalEntryFormSchema),
    defaultValues: {
      voucherDate: new Date().toISOString().split('T')[0],
      narration: '',
      entries: [
        { ledgerId: '', debitRupees: 0, creditRupees: 0, narration: '' },
        { ledgerId: '', debitRupees: 0, creditRupees: 0, narration: '' },
      ],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const watchEntries = useWatch({ control, name: 'entries' });

  // Compute totals
  const totalDebitRupees = watchEntries.reduce((sum, e) => sum + (e.debitRupees || 0), 0);
  const totalCreditRupees = watchEntries.reduce((sum, e) => sum + (e.creditRupees || 0), 0);

  const totalDebitPaise = Math.round(totalDebitRupees * 100);
  const totalCreditPaise = Math.round(totalCreditRupees * 100);

  const onSubmit = async (data: JournalFormValues) => {
    try {
      // Validations
      if (totalDebitPaise !== totalCreditPaise) {
        toast.error('Total debits must equal total credits');
        return;
      }

      if (totalDebitPaise === 0) {
        toast.error('Voucher must have a non-zero amount');
        return;
      }

      // Check for duplicate ledgers
      const ledgerIds = data.entries.map((e) => e.ledgerId);
      const uniqueLedgerIds = new Set(ledgerIds);
      if (uniqueLedgerIds.size !== ledgerIds.length) {
        toast.error('Duplicate ledgers are not allowed in the same journal entry');
        return;
      }

      // Check posting validations (manual posting, frozen, active)
      for (const entry of data.entries) {
        const ledger = ledgers.find((l) => l.id === entry.ledgerId);
        if (!ledger) {
          toast.error(`Invalid ledger selected`);
          return;
        }
        if (!ledger.isActive) {
          toast.error(`Ledger ${ledger.name} is inactive`);
          return;
        }
        if (ledger.isFrozen) {
          toast.error(`Ledger ${ledger.name} is frozen`);
          return;
        }
        if (!ledger.allowManualPosting) {
          toast.error(`Ledger ${ledger.name} does not allow manual posting`);
          return;
        }
      }

      const payload = {
        voucherType: 'Journal' as const,
        voucherNumber: 'AUTO', // Handled by backend document numbering, but schema might require something
        voucherDate: new Date(data.voucherDate).toISOString(),
        sourceModule: 'ACCOUNTING',
        referenceType: 'MANUAL' as const,
        narration: data.narration,
        entries: data.entries.map((e) => ({
          ledgerId: e.ledgerId,
          debitAmount: Math.round((e.debitRupees || 0) * 100),
          creditAmount: Math.round((e.creditRupees || 0) * 100),
          narration: e.narration,
        })),
      };

      await createVoucher(payload);
      router.push('/dashboard/accounting/journal');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save journal voucher');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="grid grid-cols-2 gap-6">
          <AppField name="voucherDate" label="Voucher Date">
            <FormInput name="voucherDate" type="date" />
          </AppField>

          <AppField name="narration" label="Common Narration">
            <FormInput name="narration" placeholder="Description for the entire voucher" />
          </AppField>
        </div>

        {errors.entries?.root && (
          <p className="text-sm text-red-500">{errors.entries.root.message}</p>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Lines</h3>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ ledgerId: '', debitRupees: 0, creditRupees: 0, narration: '' })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </AppButton>
          </div>

          <div className="overflow-hidden rounded-md border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Ledger Account
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Debit (₹)
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Credit (₹)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Narration
                  </th>
                  <th scope="col" className="relative w-12 px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <select
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                          {...methods.register(`entries.${index}.ledgerId` as const)}
                        >
                          <option value="">Select Ledger</option>
                          {ledgers
                            .filter(
                              (l: import('@vyora/types').LedgerDto) =>
                                l.isActive && !l.isFrozen && l.allowManualPosting,
                            )
                            .map((l: import('@vyora/types').LedgerDto) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      {errors.entries?.[index]?.ledgerId && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.entries[index]?.ledgerId?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <FormInput
                          name={`entries.${index}.debitRupees`}
                          type="number"
                          min="0"
                          step="0.01"
                          className="text-right"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            methods.setValue(`entries.${index}.debitRupees`, val);
                            if (val > 0) {
                              methods.setValue(`entries.${index}.creditRupees`, 0);
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <FormInput
                          name={`entries.${index}.creditRupees`}
                          type="number"
                          min="0"
                          step="0.01"
                          className="text-right"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            methods.setValue(`entries.${index}.creditRupees`, val);
                            if (val > 0) {
                              methods.setValue(`entries.${index}.debitRupees`, 0);
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <FormInput
                          name={`entries.${index}.narration`}
                          placeholder="Line narration"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="pt-2 text-gray-400 hover:text-red-500"
                        title="Remove Line"
                        disabled={fields.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <JournalSummary totalDebit={totalDebitPaise} totalCredit={totalCreditPaise} />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <AppButton type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={isPending}>
            Post Journal
          </AppButton>
        </div>
      </form>
    </FormProvider>
  );
}
