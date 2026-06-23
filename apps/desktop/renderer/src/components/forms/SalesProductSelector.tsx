import { ProductDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

interface SalesProductSelectorProps {
  name: string;
  onProductSelect?: (product: ProductDto | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SalesProductSelector({
  name,
  onProductSelect,
  className,
  placeholder = 'Search by Name, SKU, or HSN...',
  disabled,
}: SalesProductSelectorProps) {
  // Use useFormContext safely if available. If we use this outside of a form context later, we should handle that,
  // but for now it aligns with the existing AppForm/FormProvider patterns.
  const context = useFormContext();
  const setValue = context?.setValue;
  const watch = context?.watch;

  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [products, setProducts] = React.useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedProductId = watch ? watch(name) : null;
  const selectedProduct = React.useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Fetch products
  React.useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Uses the globally exposed Vyora API from preload/bridge
        const res = await window.vyora.db.products.getAll();
        if (mounted) {
          if (res.success && res.data) {
            setProducts(res.data);
          } else {
            setError(res.error || 'Failed to load products');
          }
        }
      } catch {
        if (mounted) setError('IPC Error: Could not connect to database');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products;
    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerTerm) ||
        (p.sku && p.sku.toLowerCase().includes(lowerTerm)) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(lowerTerm)),
    );
  }, [products, searchTerm]);

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
        setActiveIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[activeIndex]) {
          handleSelect(filteredProducts[activeIndex]);
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

  const handleSelect = (product: ProductDto) => {
    if (setValue) setValue(name, product.id, { shouldDirty: true });
    setSearchTerm('');
    setIsOpen(false);
    if (onProductSelect) onProductSelect(product);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setValue) setValue(name, null, { shouldDirty: true });
    if (onProductSelect) onProductSelect(null);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger Input Area */}
      <div
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

        {!isOpen && selectedProduct ? (
          <div className="flex flex-1 items-center justify-between truncate">
            <span className="text-foreground truncate font-medium">{selectedProduct.name}</span>
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
            placeholder={selectedProduct ? selectedProduct.name : placeholder}
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
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border shadow-md">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading products...
            </div>
          ) : error ? (
            <div className="text-destructive py-6 text-center text-sm">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">No products found.</div>
          ) : (
            <ul
              ref={listRef}
              className="scrollbar-thumb-border max-h-60 scrollbar-thin overflow-y-auto p-1"
            >
              {filteredProducts.map((product, index) => {
                const isSelected = selectedProductId === product.id;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={product.id}
                    className={cn(
                      'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none',
                      isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                      isSelected && 'font-medium',
                    )}
                    onClick={() => handleSelect(product)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {isSelected && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex flex-1 flex-col truncate pr-2">
                      <span className="truncate">{product.name}</span>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.sku && product.hsnCode && <span>•</span>}
                        {product.hsnCode && <span>HSN: {product.hsnCode}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end pl-2 text-xs">
                      <span className="text-foreground font-semibold">
                        {formatCurrency(product.salePrice)}
                      </span>
                      <span className="text-muted-foreground">Stock: {product.stock}</span>
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
