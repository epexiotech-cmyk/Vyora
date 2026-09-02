import { Popover } from '@base-ui/react/popover';
import { ExpensePresetDto } from '@vyora/types';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface ExpenseTypeSelectorProps {
  name: string;
  onExpenseTypeSelect?: (preset: ExpensePresetDto | null) => void;
  className?: string;
  disabled?: boolean;
  dataTestId?: string;
}

export function ExpenseTypeSelector({
  name,
  onExpenseTypeSelect,
  className,
  disabled,
  dataTestId,
}: ExpenseTypeSelectorProps) {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [presets, setPresets] = React.useState<ExpensePresetDto[]>([]);
  const [selectedPresetObj, setSelectedPresetObj] = React.useState<ExpensePresetDto | null>(null);
  const [lastFetchedId, setLastFetchedId] = React.useState<string | null | undefined>(null);

  const selectedPresetId = watch(name);

  // Render-phase state update to clear old object when ID changes
  if (selectedPresetId !== lastFetchedId) {
    setLastFetchedId(selectedPresetId);
    setSelectedPresetObj(null);
  }

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedPresetFromSearch = React.useMemo(
    () => presets.find((p) => p.id === selectedPresetId) || null,
    [presets, selectedPresetId],
  );

  const displayedPreset = selectedPresetFromSearch || selectedPresetObj;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Fetch search results automatically when debounced search changes
  React.useEffect(() => {
    let mounted = true;
    const fetchPresets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await window.vyora.db.expensePresets.search({
          query: debouncedSearch,
          isActive: true,
          limit: 15,
          offset: 0,
        });
        if (mounted) {
          if (res.success && res.data) {
            setPresets(res.data.data);
          } else {
            setError(res.error || 'Failed to load expense types');
          }
        }
      } catch {
        if (mounted) setError('IPC Error: Could not connect to database');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchPresets();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  // Ensure the explicitly selected preset is loaded even if they aren't in the current search results
  React.useEffect(() => {
    let mounted = true;
    if (
      selectedPresetId &&
      !selectedPresetFromSearch &&
      selectedPresetId !== selectedPresetObj?.id
    ) {
      // Fetch from backend
      const fetchSelected = async () => {
        try {
          const res = await window.vyora.db.expensePresets.getById(selectedPresetId);
          if (mounted && res.success && res.data) {
            setSelectedPresetObj(res.data);
          }
        } catch (e) {
          console.error('Failed to fetch selected expense type', e);
        }
      };
      fetchSelected();
    }
    return () => {
      mounted = false;
    };
  }, [selectedPresetId, selectedPresetFromSearch, selectedPresetObj?.id]);

  // Handle outside click to close dropdown (handled by Popover)
  React.useEffect(() => {}, []);

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
        setActiveIndex((prev) => (prev < presets.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (presets[activeIndex]) {
          handleSelect(presets[activeIndex]);
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

  const handleSelect = (preset: ExpensePresetDto) => {
    setValue(name, preset.id, { shouldDirty: true });
    setSelectedPresetObj(preset);
    setSearchTerm('');
    setIsOpen(false);
    if (onExpenseTypeSelect) onExpenseTypeSelect(preset);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true });
    setSelectedPresetObj(null);
    setSearchTerm('');
    if (onExpenseTypeSelect) onExpenseTypeSelect(null);
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
              data-testid={dataTestId}
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
              displayedPreset ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
          >
            {displayedPreset ? displayedPreset.name : 'Search for an expense type...'}
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
                  placeholder="Search for an expense type..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {isLoading && presets.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : error ? (
                <div className="text-destructive py-6 text-center text-sm">{error}</div>
              ) : presets.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No expense types found.
                </div>
              ) : (
                <ul
                  ref={listRef}
                  className="scrollbar-thumb-border max-h-60 scrollbar-thin overflow-y-auto p-1"
                >
                  {presets.map((preset, index) => {
                    const isSelected = selectedPresetId === preset.id;
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={preset.id}
                        data-testid={`item-option-${preset.name}`}
                        className={cn(
                          'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none',
                          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                          isSelected && 'font-medium',
                        )}
                        onClick={() => handleSelect(preset)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {isSelected && (
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span>{preset.name}</span>
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

      {/* Clear Button */}
      {displayedPreset && !disabled && (
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
