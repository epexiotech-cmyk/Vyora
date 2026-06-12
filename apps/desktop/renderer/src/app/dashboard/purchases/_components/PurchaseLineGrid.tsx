import { ProductDto } from '@vyora/types';
import { paiseToMoney } from '@vyora/utils';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { calculatePurchaseLine } from './purchase-calculations';
import { PurchaseItemSelector } from './PurchaseItemSelector';

import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';

interface PurchaseLineRowProps {
  index: number;
  onRemove: (index: number) => void;
  onProductSelected: (product: ProductDto | null, index: number) => void;
  totalRows: number;
}

const emptyLine = {
  productId: null,
  description: '',
  unitId: '',
  taxId: '',
  quantity: 1,
  rate: 0,
  discountAmount: 0,
  taxableAmount: 0,
  taxAmount: 0,
  lineTotal: 0,
  // Helper field for UI calculations (backend uses taxId to resolve rate, but UI needs rate)
  _uiTaxPercentage: 0,
};

function PurchaseLineRow({ index, onRemove, onProductSelected, totalRows }: PurchaseLineRowProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const lineErrors =
    (errors.lines as Array<Record<string, { message?: string }>> | undefined)?.[index] || {};

  // Watch fields to calculate amounts
  const qty = useWatch({ control, name: `lines.${index}.quantity` }) || 0;
  const rate = useWatch({ control, name: `lines.${index}.rate` }) || 0;
  const discountAmount = useWatch({ control, name: `lines.${index}.discountAmount` }) || 0;
  const productId = useWatch({ control, name: `lines.${index}.productId` });
  const taxPct = useWatch({ control, name: `lines.${index}._uiTaxPercentage` }) || 0;

  // Delegate row calculations to the shared engine (uses Integer Paise)
  const computed = calculatePurchaseLine({
    quantity: qty,
    rate,
    discountAmount,
    _uiTaxPercentage: taxPct,
  });

  // Since backend/helper works in paise, we convert back to float ONLY for display and RHF tracking if needed
  const lineTotal = paiseToMoney(computed.lineTotal);

  // Can remove if it's not the only row, or if it is the only row but has a product selected
  const canRemove = totalRows > 1 || !!productId;

  // Auto-update calculated fields
  React.useEffect(() => {
    setValue(`lines.${index}.taxableAmount`, paiseToMoney(computed.lineTaxable), {
      shouldDirty: true,
    });
    setValue(`lines.${index}.taxAmount`, paiseToMoney(computed.lineTax), { shouldDirty: true });
    setValue(`lines.${index}.lineTotal`, lineTotal, { shouldDirty: true });
  }, [computed.lineTaxable, computed.lineTax, lineTotal, index, setValue]);

  return (
    <div className="group border-border/50 hover:bg-muted/50 flex flex-col border-b transition-colors">
      <div className="flex items-center">
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
          <PurchaseItemSelector
            name={`lines.${index}.productId`}
            className={cn(
              'w-full border-transparent bg-transparent px-0 shadow-none focus-within:border-transparent focus-within:ring-0',
              lineErrors.productId && 'text-destructive',
            )}
            onProductSelect={(product) => onProductSelected(product, index)}
          />
        </div>

        {/* 3. Qty */}
        <div
          className={cn(
            'border-border/50 flex h-12 w-24 shrink-0 items-center border-r px-2',
            lineErrors.quantity && 'bg-destructive/10',
          )}
          title={lineErrors.quantity?.message as string | undefined}
        >
          <input
            type="number"
            min="1"
            step="any"
            className={cn(
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none',
              lineErrors.quantity && 'text-destructive font-bold',
            )}
            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
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
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none',
              lineErrors.rate && 'text-destructive font-bold',
            )}
            {...register(`lines.${index}.rate`, { valueAsNumber: true })}
          />
        </div>

        {/* 5. Disc Amt */}
        <div
          className={cn(
            'border-border/50 flex h-12 w-28 shrink-0 items-center border-r px-2',
            lineErrors.discountAmount && 'bg-destructive/10',
          )}
          title={lineErrors.discountAmount?.message as string | undefined}
        >
          <input
            type="number"
            min="0"
            step="any"
            className={cn(
              'placeholder:text-muted-foreground w-full bg-transparent text-right text-sm outline-none',
              lineErrors.discountAmount && 'text-destructive font-bold',
            )}
            {...register(`lines.${index}.discountAmount`, { valueAsNumber: true })}
          />
        </div>

        {/* 6. Amount */}
        <div className="border-border/50 flex h-12 w-36 shrink-0 items-center justify-end border-r px-4 text-sm font-medium">
          ₹{lineTotal.toFixed(2)}
        </div>

        {/* 7. Delete */}
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
      </div>

      {/* Description Row (Optional) */}
      <div className="border-border/20 bg-muted/10 flex h-8 items-center border-t">
        <div className="border-border/20 w-12 shrink-0 border-r"></div>
        <div className="flex-1 px-3">
          <input
            type="text"
            placeholder="Item description (optional)"
            className="text-muted-foreground w-full bg-transparent text-xs outline-none"
            {...register(`lines.${index}.description`)}
          />
        </div>
      </div>
    </div>
  );
}

export function PurchaseLineGrid() {
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

  const handleProductSelected = (product: ProductDto | null, index: number) => {
    if (product) {
      // Auto-populate row fields based on selected product
      setValue(`lines.${index}.description`, product.description || '');
      setValue(`lines.${index}.unitId`, product.unitId || '');
      setValue(`lines.${index}.taxId`, product.taxId || '');

      // In Phase 5.5.9C, without a tax master lookup, we'll assume a basic logic
      // or retrieve it if cached in the parent. The parent can hydrate _uiTaxPercentage.
      // But for now, we leave it at 0 unless injected.

      setValue(`lines.${index}.rate`, paiseToMoney(product.purchasePrice || 0));
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
    <div className="border-border flex flex-col overflow-hidden rounded-md border">
      {/* Grid Header */}
      <div className="bg-muted/50 text-muted-foreground border-border/50 flex shrink-0 border-b text-xs font-semibold">
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
        <div className="border-border/50 flex h-10 w-28 shrink-0 items-center justify-end border-r px-4">
          Disc Amt
        </div>
        <div className="border-border/50 flex h-10 w-36 shrink-0 items-center justify-end border-r px-4">
          Amount
        </div>
        <div className="flex h-10 w-12 shrink-0 items-center justify-center"></div>
      </div>

      {/* Grid Body */}
      <div className="scrollbar-thumb-border flex-1 scrollbar-thin overflow-y-auto">
        <div className="flex flex-col">
          {fields.map((field, index) => (
            <PurchaseLineRow
              key={field.id}
              index={index}
              onRemove={handleRemoveRow}
              onProductSelected={handleProductSelected}
              totalRows={fields.length}
            />
          ))}
        </div>
      </div>

      {/* Grid Footer / Action Bar */}
      <div className="bg-muted/10 flex shrink-0 items-center p-2">
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddLine}
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Line
        </AppButton>
      </div>
    </div>
  );
}
