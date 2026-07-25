import { ProductDto } from '@vyora/types';
import { InvoiceCalculationResult } from '@vyora/types';
import { paiseToMoney, formatMoney } from '@vyora/utils';
import { CurrencyMetaPartial } from '@vyora/utils';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { SalesProductSelector } from '@/components/forms/SalesProductSelector';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';

interface InvoiceLineRowProps {
  index: number;
  onRemove: (index: number) => void;
  onProductSelected: (product: ProductDto | null, index: number) => void;
  totalRows: number;
  engineLineResult?: InvoiceCalculationResult['items'][number];
  isReadOnly?: boolean;
  currencyMeta?: CurrencyMetaPartial;
}

const emptyLine = {
  productId: null,
  productName: '',
  qty: 1,
  rate: 0,
  discountPercent: 0,
  taxPercent: 0,
  amount: 0,
};

function InvoiceLineRow({
  index,
  onRemove,
  onProductSelected,
  totalRows,
  engineLineResult,
  isReadOnly,
  currencyMeta,
}: InvoiceLineRowProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const lineErrors =
    (errors.lines as Array<Record<string, { message?: string }>> | undefined)?.[index] || {};

  const productId = useWatch({ control, name: `lines.${index}.productId` });

  // We don't manually calculate amount anymore. The engine gives us lineTotal in paise.
  const amount = engineLineResult ? paiseToMoney(engineLineResult.lineTotal) : 0;

  // Can remove if it's not the only row, or if it is the only row but has a product selected
  const canRemove = totalRows > 1 || !!productId;

  // Auto-update amount field in form state for completeness
  React.useEffect(() => {
    setValue(`lines.${index}.amount`, amount, { shouldDirty: true });
  }, [amount, index, setValue]);

  return (
    <div className="group border-border/50 hover:bg-muted/50 flex items-center border-b transition-colors">
      {/* 1. # */}
      <div className="text-muted-foreground border-border/50 flex h-12 w-12 shrink-0 items-center justify-center border-r text-xs">
        {index + 1}
      </div>

      {/* 2. Product */}
      <div
        className={cn(
          'border-border/50 flex h-12 flex-1 items-center border-r px-2',
          lineErrors.productId && 'bg-destructive/10',
        )}
        title={lineErrors.productId?.message as string | undefined}
      >
        <SalesProductSelector
          name={`lines.${index}.productId`}
          data-testid={`line-item-select-${index}`}
          placeholder="Select product..."
          className={cn(
            'w-full border-transparent bg-transparent px-0 shadow-none focus-within:border-transparent focus-within:ring-0',
            lineErrors.productId && 'text-destructive',
          )}
          onProductSelect={(product) => onProductSelected(product, index)}
          disabled={isReadOnly}
        />
      </div>

      {/* 3. Qty */}
      <div
        className={cn(
          'border-border/50 flex h-12 w-24 shrink-0 items-center border-r px-2',
          lineErrors.qty && 'bg-destructive/10',
        )}
        title={lineErrors.qty?.message as string | undefined}
      >
        <input
          type="number"
          min="1"
          step="any"
          className={cn(
            'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:opacity-50',
            lineErrors.qty && 'text-destructive font-bold',
          )}
          disabled={isReadOnly}
          {...register(`lines.${index}.qty`, { valueAsNumber: true })}
          data-testid={`line-qty-input-${index}`}
        />
      </div>

      {/* 4. Rate */}
      <div
        className={cn(
          'border-border/50 flex h-12 w-32 shrink-0 items-center border-r px-2',
          lineErrors.rate && 'bg-destructive/10',
        )}
        title={lineErrors.rate?.message as string | undefined}
      >
        <input
          type="number"
          min="0"
          step="any"
          className={cn(
            'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:opacity-50',
            lineErrors.rate && 'text-destructive font-bold',
          )}
          disabled={isReadOnly}
          {...register(`lines.${index}.rate`, { valueAsNumber: true })}
          data-testid={`line-rate-input-${index}`}
        />
      </div>

      {/* 5. Disc % */}
      <div
        className={cn(
          'border-border/50 flex h-12 w-20 shrink-0 items-center border-r px-2',
          lineErrors.discountPercent && 'bg-destructive/10',
        )}
        title={lineErrors.discountPercent?.message as string | undefined}
      >
        <input
          type="number"
          min="0"
          max="100"
          step="any"
          className={cn(
            'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:opacity-50',
            lineErrors.discountPercent && 'text-destructive font-bold',
          )}
          disabled={isReadOnly}
          {...register(`lines.${index}.discountPercent`, { valueAsNumber: true })}
        />
      </div>

      {/* 6. Tax % */}
      <div
        className={cn(
          'border-border/50 flex h-12 w-20 shrink-0 items-center border-r px-2',
          lineErrors.taxPercent && 'bg-destructive/10',
        )}
        title={lineErrors.taxPercent?.message as string | undefined}
      >
        <input
          type="number"
          min="0"
          max="100"
          step="any"
          className={cn(
            'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none disabled:opacity-50',
            lineErrors.taxPercent && 'text-destructive font-bold',
          )}
          disabled={isReadOnly}
          {...register(`lines.${index}.taxPercent`, { valueAsNumber: true })}
        />
      </div>

      {/* 7. Amount */}
      <div className="border-border/50 flex h-12 w-32 shrink-0 items-center justify-end border-r px-4 text-sm font-medium">
        {formatMoney(
          engineLineResult ? engineLineResult.lineTotal : 0,
          currencyMeta as CurrencyMetaPartial,
        )}
      </div>

      {/* 8. Delete */}
      {!isReadOnly && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="text-muted-foreground hover:text-destructive disabled:hover:text-muted-foreground focus:ring-ring rounded-sm p-1 transition-colors outline-none focus:ring-1 disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function InvoiceLineGrid({
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

  const handleProductSelected = async (product: ProductDto | null, index: number) => {
    if (product) {
      // Auto-populate row fields based on selected product
      setValue(`lines.${index}.productName`, product.name);
      const divisor = Math.pow(10, context?.currency?.decimalPlaces ?? 2);
      setValue(`lines.${index}.rate`, product.salePrice ? product.salePrice / divisor : 0);
      setValue(`lines.${index}.qty`, 1);
      setValue(`lines.${index}.unitId`, product.unitId || null);
      setValue(`lines.${index}.taxId`, product.taxId || null);
      setValue(`lines.${index}.hsnCode`, product.hsnCode || null);

      if (product.taxId) {
        try {
          const taxRes = await window.vyora.db.taxes.getAll();
          if (taxRes.success && taxRes.data) {
            const tax = taxRes.data.find((t) => t.id === product.taxId);
            if (tax) {
              setValue(`lines.${index}.taxPercent`, tax.rate);
            }
          }
        } catch (err) {
          console.error('Failed to fetch tax for product', err);
        }
      } else {
        setValue(`lines.${index}.taxPercent`, 0);
      }

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
    <div className="flex h-full flex-col">
      {/* Grid Header */}
      <div className="border-border/50 bg-muted/30 text-muted-foreground flex shrink-0 border-b text-xs font-semibold">
        <div className="border-border/50 flex h-10 w-12 shrink-0 items-center justify-center border-r">
          #
        </div>
        <div className="border-border/50 flex h-10 flex-1 items-center border-r px-4">Product</div>
        <div className="border-border/50 flex h-10 w-24 shrink-0 items-center justify-end border-r px-4">
          Qty
        </div>
        <div className="border-border/50 flex h-10 w-32 shrink-0 items-center justify-end border-r px-4">
          Rate
        </div>
        <div className="border-border/50 flex h-10 w-20 shrink-0 items-center justify-end border-r px-4">
          Disc %
        </div>
        <div className="border-border/50 flex h-10 w-20 shrink-0 items-center justify-end border-r px-4">
          {context?.company?.gstin ? 'GST %' : 'Tax %'}
        </div>
        <div className="border-border/50 flex h-10 w-32 shrink-0 items-center justify-end border-r px-4">
          Amount
        </div>
        <div className="flex h-10 w-12 shrink-0 items-center justify-center"></div>
      </div>

      {/* Grid Body */}
      <div className="scrollbar-thumb-border min-h-[200px] flex-1 scrollbar-thin overflow-y-auto">
        <div className="flex flex-col">
          {fields.map((field, index) => (
            <InvoiceLineRow
              key={field.id}
              index={index}
              onRemove={handleRemoveRow}
              onProductSelected={handleProductSelected}
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
        <div className="border-border/50 flex shrink-0 items-center border-t p-3">
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddLine}
            className="text-primary hover:text-primary hover:bg-primary/10"
            data-testid="add-sales-line-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </AppButton>
        </div>
      )}
    </div>
  );
}
