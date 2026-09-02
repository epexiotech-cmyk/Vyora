import { Popover } from '@base-ui/react/popover';
import { PaymentAccountDto } from '@vyora/types';
import { Check, ChevronsUpDown, Loader2, Search, X, Landmark, Wallet } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface PaymentAccountSelectorProps {
  name: string;
  onAccountSelect?: (account: PaymentAccountDto | null) => void;
  className?: string;
  disabled?: boolean;
  accountType?: string;
}

export function PaymentAccountSelector({
  name,
  onAccountSelect,
  className,
  disabled,
  accountType,
}: PaymentAccountSelectorProps) {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [accounts, setAccounts] = React.useState<PaymentAccountDto[]>([]);
  const [selectedAccountObj, setSelectedAccountObj] = React.useState<PaymentAccountDto | null>(
    null,
  );
  const [lastFetchedId, setLastFetchedId] = React.useState<string | null | undefined>(null);

  const selectedAccountId = watch(name);

  if (selectedAccountId !== lastFetchedId) {
    setLastFetchedId(selectedAccountId);
    setSelectedAccountObj(null);
  }

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedAccountFromSearch = React.useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );

  const displayedAccount = selectedAccountFromSearch || selectedAccountObj;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await window.vyora.paymentAccounts.search({
          searchQuery: debouncedSearch,
          isActive: true,
          accountType: accountType as import('@vyora/database').PaymentAccountType | undefined,
        });
        if (mounted) {
          if (Array.isArray(res)) {
            setAccounts(res);
          } else {
            setError('Failed to load accounts');
          }
        }
      } catch {
        if (mounted) setError('IPC Error: Could not connect to database');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchAccounts();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, accountType]);

  React.useEffect(() => {
    let mounted = true;
    if (
      selectedAccountId &&
      !selectedAccountFromSearch &&
      selectedAccountId !== selectedAccountObj?.id
    ) {
      const fetchSelected = async () => {
        try {
          const res = await window.vyora.paymentAccounts.getById(selectedAccountId);
          if (mounted && res && res.id) {
            setSelectedAccountObj(res);
          }
        } catch (e) {
          console.error('Failed to fetch selected account', e);
        }
      };
      fetchSelected();
    }
    return () => {
      mounted = false;
    };
  }, [selectedAccountId, selectedAccountFromSearch, selectedAccountObj?.id]);

  React.useEffect(() => {
    // The popover handles outside clicks for us, but if we need to close on escape we can keep this or let popover handle it.
    // However, if we are using controlled open state without relying on Popover's built in click outside,
    // we can keep it. But Base-UI popover will call `onOpenChange(false)` when clicking outside.
  }, []);

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
        setActiveIndex((prev) => (prev < accounts.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (accounts[activeIndex]) {
          handleSelect(accounts[activeIndex]);
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

  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (account: PaymentAccountDto) => {
    setValue(name, account.id, { shouldDirty: true });
    setSelectedAccountObj(account);
    setSearchTerm('');
    setIsOpen(false);
    if (onAccountSelect) onAccountSelect(account);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true });
    setSelectedAccountObj(null);
    setSearchTerm('');
    if (onAccountSelect) onAccountSelect(null);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Popover.Trigger
          nativeButton={false}
          render={
            <div
              data-testid="payment-account-select"
              className={cn(
                'border-input bg-background focus-within:ring-ring flex h-9 w-full cursor-pointer items-center rounded-md border py-1 pr-8 pl-3 text-sm shadow-sm transition-colors outline-none focus-within:ring-1',
                isOpen && 'ring-ring ring-1',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
        >
          <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />

          <div className="flex flex-1 items-center gap-2 truncate text-left">
            {!displayedAccount ? (
              <span className="text-muted-foreground flex-1 truncate">
                Select Payment Account...
              </span>
            ) : (
              <>
                {displayedAccount.accountType === 'BANK' ? (
                  <Landmark className="text-muted-foreground h-4 w-4 shrink-0" />
                ) : displayedAccount.accountType === 'CASH' ? (
                  <Wallet className="text-muted-foreground h-4 w-4 shrink-0" />
                ) : null}
                <span className="text-foreground truncate font-medium">
                  {displayedAccount.displayName}
                </span>
              </>
            )}
          </div>
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
            <Popover.Popup className="animate-in fade-in-0 zoom-in-95 border-border/60 z-50 w-full overflow-hidden rounded-md border bg-white text-gray-900 opacity-100 shadow-lg outline-none">
              {/* Dedicated Search Input Area */}
              <div className="flex items-center border-b px-3 py-2">
                <Search className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  className="placeholder:text-muted-foreground text-foreground flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search payment accounts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {isLoading && accounts.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : error ? (
                <div className="text-destructive py-6 text-center text-sm">{error}</div>
              ) : accounts.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No payment accounts found.
                </div>
              ) : (
                <ul ref={listRef} className="max-h-60 overflow-auto p-1">
                  {accounts.map((account, index) => (
                    <li
                      key={account.id}
                      onClick={() => handleSelect(account)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm transition-colors outline-none',
                        index === activeIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50',
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2 truncate">
                        {account.accountType === 'BANK' ? (
                          <Landmark className="text-muted-foreground h-4 w-4 shrink-0" />
                        ) : account.accountType === 'CASH' ? (
                          <Wallet className="text-muted-foreground h-4 w-4 shrink-0" />
                        ) : null}
                        <div className="flex flex-col truncate">
                          <span className="truncate font-medium">{account.displayName}</span>
                        </div>
                      </div>
                      {selectedAccountId === account.id && (
                        <Check className="ml-2 h-4 w-4 shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Clear Button */}
      {displayedAccount && !disabled && (
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
