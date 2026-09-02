import { SupplierProfileDto } from '@vyora/types';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface PurchaseSupplierSelectorProps {
  name: string;
  onSupplierSelect?: (supplier: SupplierProfileDto | null) => void;
  className?: string;
  disabled?: boolean;
}

export function PurchaseSupplierSelector({
  name,
  onSupplierSelect,
  className,
  disabled,
}: PurchaseSupplierSelectorProps) {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

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

  // Handle outside click to close dropdown
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
    setSelectedSupplierObj(supplier);
    setSearchTerm('');
    setIsOpen(false);
    if (onSupplierSelect) onSupplierSelect(supplier);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true });
    setSelectedSupplierObj(null);
    setSearchTerm('');
    if (onSupplierSelect) onSupplierSelect(null);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger Input Area */}
      <div
        data-testid="purchase-supplier-select"
        className={cn(
          'border-input bg-background focus-within:ring-ring flex h-9 w-full cursor-text items-center rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1',
          isOpen && 'ring-ring ring-1',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />

        {!isOpen && displayedSupplier ? (
          <div className="flex flex-1 items-center justify-between truncate">
            <span className="text-foreground truncate font-medium">{displayedSupplier.name}</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground ml-2 shrink-0 outline-none disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            className="placeholder:text-muted-foreground text-foreground flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
            placeholder={
              displayedSupplier ? displayedSupplier.name : 'Search by Name, Mobile, or GSTIN...'
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
          />
        )}

        <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg">
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
        </div>
      )}
    </div>
  );
}
