import { ExpensePresetDto } from '@vyora/types';
import { InvoiceCalculationResult } from '@vyora/types';
import { paiseToMoney, formatMoney } from '@vyora/utils';
import { CurrencyMetaPartial } from '@vyora/utils';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { ExpenseTypeSelector } from './ExpenseTypeSelector';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';

interface ExpenseLineRowProps {
  index: number;
  onRemove: (index: number) => void;
  onPresetSelected: (preset: ExpensePresetDto | null, index: number) => void;
  totalRows: number;
  engineLineResult?: InvoiceCalculationResult['items'][0];
  isReadOnly?: boolean;
  currencyMeta?: CurrencyMetaPartial;
}

const emptyLine = {
  expensePresetId: null,
  description: '',
  taxId: '',
  quantity: 1,
  rate: 0,
  discountAmount: 0,
  taxableAmount: 0,
  taxAmount: 0,
  lineTotal: 0,
  _uiTaxPercentage: 0,
};

function ExpenseLineRow({
  index,
  onRemove,
  onPresetSelected,
  totalRows,
  engineLineResult,
  isReadOnly,
  currencyMeta,
}: ExpenseLineRowProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const lineErrors =
    (errors.lines as Array<Record<string, { message?: string }>> | undefined)?.[index] || {};

  const expensePresetId = useWatch({ control, name: `lines.${index}.expensePresetId` });

  // Delegate row calculations to the shared engine (uses Integer Paise)
  // We don't manually calculate amount anymore. The engine gives us lineTotal in paise.
  const lineTotal = engineLineResult ? paiseToMoney(engineLineResult.lineTotal) : 0;
  const lineTaxable = engineLineResult ? paiseToMoney(engineLineResult.taxableAmount) : 0;
  const lineTax = engineLineResult ? paiseToMoney(engineLineResult.taxAmount) : 0;

  // Can remove if it's not the only row, or if it is the only row but has a preset selected
  const canRemove = totalRows > 1 || !!expensePresetId;

  // Auto-update calculated fields
  React.useEffect(() => {
    setValue(`lines.${index}.taxableAmount`, lineTaxable, {
      shouldDirty: true,
    });
    setValue(`lines.${index}.taxAmount`, lineTax, { shouldDirty: true });
    setValue(`lines.${index}.lineTotal`, lineTotal, { shouldDirty: true });
  }, [lineTaxable, lineTax, lineTotal, index, setValue]);

  return (
    <div
      className={cn(
        'group border-border/40 hover:bg-muted/50 flex flex-col border-b transition-colors',
        index % 2 === 1 && 'bg-muted/20',
      )}
    >
      <div className="flex items-center">
        {/* 1. # */}
        <div className="text-muted-foreground flex h-14 w-12 shrink-0 items-center justify-center text-xs font-medium">
          {index + 1}
        </div>

        {/* 2. Expense Type */}
        <div
          className={cn(
            'flex h-14 flex-1 items-center px-2',
            lineErrors.expensePresetId && 'bg-destructive/10 my-1 rounded-md',
          )}
          title={lineErrors.expensePresetId?.message as string | undefined}
        >
          <ExpenseTypeSelector
            name={`lines.${index}.expensePresetId`}
            dataTestId={`line-item-select-${index}`}
            className={cn(
              'w-full border-transparent bg-transparent px-0 shadow-none focus-within:border-transparent focus-within:ring-0',
              lineErrors.expensePresetId && 'text-destructive',
            )}
            onExpenseTypeSelect={(preset) => onPresetSelected(preset, index)}
            disabled={isReadOnly}
          />
        </div>

        {/* 3. Qty */}
        <div
          className={cn(
            'flex h-14 w-24 shrink-0 items-center px-2 transition-colors',
            lineErrors.quantity && 'bg-destructive/10 my-1 rounded-md',
          )}
          title={lineErrors.quantity?.message as string | undefined}
        >
          <input
            type="number"
            min="1"
            step="any"
            data-testid={`line-qty-input-${index}`}
            className={cn(
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              lineErrors.quantity && 'text-destructive font-bold',
            )}
            disabled={isReadOnly}
            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
          />
        </div>

        {/* 4. Rate */}
        <div
          className={cn(
            'flex h-14 w-32 shrink-0 items-center px-2 transition-colors',
            lineErrors.rate && 'bg-destructive/10 my-1 rounded-md',
          )}
          title={lineErrors.rate?.message as string | undefined}
        >
          <input
            type="number"
            min="0"
            step="any"
            data-testid={`line-rate-input-${index}`}
            className={cn(
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              lineErrors.rate && 'text-destructive font-bold',
            )}
            disabled={isReadOnly}
            {...register(`lines.${index}.rate`, { valueAsNumber: true })}
          />
        </div>

        {/* 5. Disc Amt */}
        <div
          className={cn(
            'flex h-14 w-28 shrink-0 items-center px-2 transition-colors',
            lineErrors.discountAmount && 'bg-destructive/10 my-1 rounded-md',
          )}
          title={lineErrors.discountAmount?.message as string | undefined}
        >
          <input
            type="number"
            min="0"
            step="any"
            className={cn(
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              lineErrors.discountAmount && 'text-destructive font-bold',
            )}
            disabled={isReadOnly}
            {...register(`lines.${index}.discountAmount`, { valueAsNumber: true })}
          />
        </div>

        {/* 6. Amount */}
        <div className="flex h-14 w-36 shrink-0 items-center justify-end px-4 text-sm font-semibold">
          {formatMoney(
            engineLineResult ? engineLineResult.lineTotal : 0,
            currencyMeta as CurrencyMetaPartial,
          )}
        </div>

        {/* 7. Delete */}
        <div className="flex h-14 w-12 shrink-0 items-center justify-center">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={!canRemove}
              className="text-muted-foreground hover:text-destructive disabled:hover:text-muted-foreground focus:ring-ring rounded-sm p-1 transition-colors outline-none focus:ring-1 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description Row (Optional) */}
      <div className="border-border/20 flex h-9 items-center border-t">
        <div className="w-12 shrink-0"></div>
        <div className="flex-1 px-3">
          <input
            type="text"
            placeholder="Item description (optional)"
            className="text-muted-foreground w-full bg-transparent text-xs outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isReadOnly}
            {...register(`lines.${index}.description`)}
          />
        </div>
      </div>
    </div>
  );
}

export function ExpenseLineGrid({
  calculationState,
  isReadOnly,
}: {
  calculationState?: { totals: InvoiceCalculationResult; isCalculating: boolean };
  isReadOnly?: boolean;
}) {
  const { context } = useCompanyContext();
  const { control, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  // Ensure minimum 1 empty row on mount
  React.useEffect(() => {
    if (fields.length === 0) {
      append(emptyLine, { shouldFocus: false });
    }
  }, [fields.length, append]);

  const handlePresetSelected = (preset: ExpensePresetDto | null, index: number) => {
    if (preset) {
      // Auto-populate row fields based on selected preset
      setValue(`lines.${index}.taxGroupId`, preset.defaultTaxGroupId || '');

      setValue(`lines.${index}.rate`, 0); // No default amount for expenses usually, but could add if added to preset later
      setValue(`lines.${index}.quantity`, 1);

      // Auto-add new empty row if this was the last row
      if (index === fields.length - 1) {
        append(emptyLine, { shouldFocus: false });
      }
    }
  };

  const handleRemoveRow = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      // If it's the last row, just clear it instead of removing it
      setValue(`lines.${index}`, emptyLine);
    }
  };

  const handleAddLine = () => {
    append(emptyLine);
  };

  return (
    <div className="border-border/60 flex flex-col overflow-hidden rounded-lg border shadow-sm">
      {/* Grid Header */}
      <div className="bg-muted/30 text-muted-foreground border-border/40 flex shrink-0 border-b text-[11px] font-semibold tracking-wider uppercase">
        <div className="flex h-10 w-12 shrink-0 items-center justify-center">#</div>
        <div className="flex h-10 flex-1 items-center px-4">Expense Type</div>
        <div className="flex h-10 w-24 shrink-0 items-center justify-end px-4">Qty</div>
        <div className="flex h-10 w-32 shrink-0 items-center justify-end px-4">Rate</div>
        <div className="flex h-10 w-28 shrink-0 items-center justify-end px-4">Disc Amt</div>
        <div className="flex h-10 w-36 shrink-0 items-center justify-end px-4">Amount</div>
        <div className="flex h-10 w-12 shrink-0 items-center justify-center"></div>
      </div>

      {/* Grid Body */}
      <div className="scrollbar-thumb-border flex-1 scrollbar-thin overflow-y-auto">
        <div className="flex flex-col">
          {fields.map((field, index) => (
            <ExpenseLineRow
              key={field.id}
              index={index}
              onRemove={handleRemoveRow}
              onPresetSelected={handlePresetSelected}
              totalRows={fields.length}
              engineLineResult={calculationState?.totals?.items?.[index]}
              isReadOnly={isReadOnly}
              currencyMeta={context?.currency}
            />
          ))}
        </div>
      </div>

      {/* Grid Footer / Action Bar */}
      {!isReadOnly && (
        <div className="bg-muted/10 flex shrink-0 items-center p-2">
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            data-testid="add-expense-line-btn"
            onClick={handleAddLine}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another item
          </AppButton>
        </div>
      )}
    </div>
  );
}
