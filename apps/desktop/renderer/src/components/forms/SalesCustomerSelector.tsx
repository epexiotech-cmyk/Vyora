import { CustomerDto } from '@vyora/types';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

interface SalesCustomerSelectorProps {
  name: string;
  onCustomerSelect?: (customer: CustomerDto | null) => void;
  className?: string;
}

export function SalesCustomerSelector({
  name,
  onCustomerSelect,
  className,
}: SalesCustomerSelectorProps) {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [customers, setCustomers] = React.useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedCustomerId = watch(name);
  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Fetch customers
  React.useEffect(() => {
    let mounted = true;
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Uses the globally exposed Vyora API from preload/bridge
        const res = await window.vyora.db.customers.getAll();
        if (mounted) {
          if (res.success && res.data) {
            setCustomers(res.data);
          } else {
            setError(res.error || 'Failed to load customers');
          }
        }
      } catch {
        if (mounted) setError('IPC Error: Could not connect to database');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter customers based on search term
  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) return customers;
    const lowerTerm = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerTerm) ||
        (c.mobile && c.mobile.includes(lowerTerm)) ||
        (c.gstin && c.gstin.toLowerCase().includes(lowerTerm)),
    );
  }, [customers, searchTerm]);

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
        setActiveIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCustomers[activeIndex]) {
          handleSelect(filteredCustomers[activeIndex]);
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

  const handleSelect = (customer: CustomerDto) => {
    setValue(name, customer.id, { shouldDirty: true });
    setSearchTerm('');
    setIsOpen(false);
    if (onCustomerSelect) onCustomerSelect(customer);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true });
    if (onCustomerSelect) onCustomerSelect(null);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger Input Area */}
      <div
        className={cn(
          'border-input bg-background focus-within:ring-ring flex h-9 w-full cursor-text items-center rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1',
          isOpen && 'ring-ring ring-1',
        )}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />

        {!isOpen && selectedCustomer ? (
          <div className="flex flex-1 items-center justify-between truncate">
            <span className="text-foreground truncate font-medium">{selectedCustomer.name}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground ml-2 shrink-0 outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="placeholder:text-muted-foreground text-foreground flex-1 bg-transparent outline-none"
            placeholder={
              selectedCustomer ? selectedCustomer.name : 'Search by Name, Mobile, or GSTIN...'
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
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border shadow-md">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading customers...
            </div>
          ) : error ? (
            <div className="text-destructive py-6 text-center text-sm">{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              No customers found.
            </div>
          ) : (
            <ul
              ref={listRef}
              className="scrollbar-thumb-border max-h-60 scrollbar-thin overflow-y-auto p-1"
            >
              {filteredCustomers.map((customer, index) => {
                const isSelected = selectedCustomerId === customer.id;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={customer.id}
                    className={cn(
                      'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none',
                      isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                      isSelected && 'font-medium',
                    )}
                    onClick={() => handleSelect(customer)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {isSelected && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        {customer.mobile && <span>{customer.mobile}</span>}
                        {customer.mobile && customer.gstin && <span>•</span>}
                        {customer.gstin && <span>{customer.gstin}</span>}
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
