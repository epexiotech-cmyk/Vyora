import { Popover } from '@base-ui/react/popover';
import { SupplierProfileDto } from '@vyora/types';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface ExpensePayeeSelectorProps {
  name: string; // The form field name for supplierId (optional)
  supplierNameField: string; // The form field name for supplierName (free-text)
  onSupplierSelect?: (supplier: SupplierProfileDto | null, freeTextName?: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ExpensePayeeSelector({
  name,
  supplierNameField,
  onSupplierSelect,
  className,
  disabled,
}: ExpensePayeeSelectorProps) {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(supplierSearchQuery, 300);

  const [suppliers, setSuppliers] = React.useState<SupplierProfileDto[]>([]);
  const [selectedSupplierObj, setSelectedSupplierObj] = React.useState<SupplierProfileDto | null>(
    null,
  );
  const [lastFetchedId, setLastFetchedId] = React.useState<string | null | undefined>(null);

  const selectedSupplierId = watch(name);

  // Render-phase state update to clear old supplier object when ID changes
  if (selectedSupplierId !== lastFetchedId) {
    setLastFetchedId(selectedSupplierId);
    setSelectedSupplierObj(null);
  }

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedSupplierFromSearch = React.useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId],
  );

  const displayedSupplier = selectedSupplierFromSearch || selectedSupplierObj;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Fetch search results automatically when debounced search changes
  React.useEffect(() => {
    let mounted = true;
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await window.vyora.db.suppliers.search({
          query: debouncedSearch,
          isActive: true,
          limit: 15,
        });
        if (mounted) {
          if (res.success && res.data) {
            setSuppliers(res.data.data);
          } else {
            setError(res.error || 'Failed to load suppliers');
          }
        }
      } catch {
        if (mounted) setError('IPC Error: Could not connect to database');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchSuppliers();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  // Ensure the explicitly selected supplier is loaded even if they aren't in the current search results
  React.useEffect(() => {
    let mounted = true;
    if (
      selectedSupplierId &&
      !selectedSupplierFromSearch &&
      selectedSupplierId !== selectedSupplierObj?.id
    ) {
      // Fetch from backend
      const fetchSelected = async () => {
        try {
          const res = await window.vyora.db.suppliers.getById(selectedSupplierId);
          if (mounted && res.success && res.data) {
            setSelectedSupplierObj(res.data);
          }
        } catch (e) {
          console.error('Failed to fetch selected supplier', e);
        }
      };
      fetchSelected();
    }
    return () => {
      mounted = false;
    };
  }, [selectedSupplierId, selectedSupplierFromSearch, selectedSupplierObj?.id]);

  // Handle outside click to close dropdown (handled by Popover now)
  React.useEffect(() => {
    // Popover handles outside clicks for us, but we can keep the effect empty.
  }, []);

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suppliers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (suppliers[activeIndex]) {
          handleSelect(suppliers[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll active item into view during keyboard navigation
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (supplier: SupplierProfileDto) => {
    setValue(name, supplier.id, { shouldDirty: true });
    setValue(supplierNameField, supplier.name, { shouldDirty: true });
    setValue('isMiscellaneous', false, { shouldDirty: true });
    setSelectedSupplierObj(supplier);
    setSupplierSearchQuery('');
    setIsOpen(false);
    if (onSupplierSelect) onSupplierSelect(supplier, undefined);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true });
    setValue(supplierNameField, '', { shouldDirty: true });
    setValue('isMiscellaneous', false, { shouldDirty: true });
    setSelectedSupplierObj(null);
    setSupplierSearchQuery('');
    if (onSupplierSelect) onSupplierSelect(null, undefined);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setSupplierSearchQuery('');
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Popover.Trigger
          nativeButton={false}
          render={
            <div
              data-testid="purchase-supplier-select"
              className={cn(
                'border-input bg-background focus-within:ring-ring flex h-9 w-full cursor-pointer items-center rounded-md border py-1 pr-8 pl-3 text-sm shadow-sm transition-colors outline-none focus-within:ring-1',
                isOpen && 'ring-ring ring-1',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
        >
          <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
          <span
            className={cn(
              'flex-1 truncate text-left',
              displayedSupplier || watch(supplierNameField)
                ? 'text-foreground font-medium'
                : 'text-muted-foreground',
            )}
          >
            {displayedSupplier?.name || watch(supplierNameField) || 'Select a Supplier...'}
          </span>
        </Popover.Trigger>

        {/* Dropdown Menu */}
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            className="z-50 outline-none"
            style={{ width: 'var(--anchor-width)' }}
          >
            <Popover.Popup className="bg-background text-foreground animate-in fade-in-0 zoom-in-95 border-border/60 z-50 w-full overflow-hidden rounded-md border opacity-100 shadow-lg outline-none">
              {/* Dedicated Search Input Area */}
              <div className="flex items-center border-b px-3 py-2">
                <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  className="placeholder:text-muted-foreground text-foreground flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search suppliers or enter custom payee..."
                  value={supplierSearchQuery}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    setValue(supplierNameField, e.target.value, { shouldDirty: true });
                    setValue('isMiscellaneous', false, { shouldDirty: true });
                    if (selectedSupplierId) {
                      // If they start typing, clear the selected supplier ID to allow free text
                      setValue(name, null, { shouldDirty: true });
                      setSelectedSupplierObj(null);
                      if (onSupplierSelect) onSupplierSelect(null, e.target.value);
                    }
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Supplier List */}
              {isLoading && suppliers.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : error ? (
                <div className="text-destructive py-6 text-center text-sm">{error}</div>
              ) : suppliers.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No suppliers found.
                </div>
              ) : (
                <ul
                  ref={listRef}
                  className="scrollbar-thumb-border max-h-60 scrollbar-thin overflow-y-auto p-1"
                >
                  {suppliers.map((supplier, index) => {
                    const isSelected = selectedSupplierId === supplier.id;
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={supplier.id}
                        data-testid={`supplier-option-${supplier.name}`}
                        className={cn(
                          'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none',
                          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                          isSelected && 'font-medium',
                        )}
                        onClick={() => handleSelect(supplier)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {isSelected && (
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span>{supplier.name}</span>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            {supplier.mobile && <span>{supplier.mobile}</span>}
                            {supplier.mobile && supplier.gstin && <span>•</span>}
                            {supplier.gstin && <span>{supplier.gstin}</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Clear Button (Sibling to trigger to avoid nested buttons warning) */}
      {(displayedSupplier || watch(supplierNameField)) && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-8 z-10 -translate-y-1/2 p-1 outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Chevrons */}
      <ChevronsUpDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 z-0 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  );
}
