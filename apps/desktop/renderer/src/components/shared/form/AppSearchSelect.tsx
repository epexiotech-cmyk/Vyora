'use client';

import { Search, Loader2, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

import { AppInput } from '@/components/ui/AppInput';
import { cn } from '@/lib/utils';

export interface AppSearchSelectProps<T> {
  label?: string;
  value?: T | null;
  onChange?: (value: T | null) => void;
  onSearch?: (query: string) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
}

export function AppSearchSelect<T>({
  label,
  value,
  onChange,
  onSearch,
  options,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select...',
  isLoading = false,
  error,
  disabled = false,
}: AppSearchSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: T) => {
    onChange?.(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const displayValue = value ? getOptionLabel(value) : '';

  return (
    <div className="relative flex flex-col space-y-1.5" ref={wrapperRef}>
      {label && (
        <label className={cn('text-sm leading-none font-medium', error && 'text-destructive')}>
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={cn(
            'border-input bg-background/50 flex h-8 w-full cursor-pointer items-center justify-between rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-destructive',
            !value && 'text-muted-foreground',
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className="truncate">{value ? displayValue : placeholder}</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-50" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </div>

        {isOpen && (
          <div className="bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border p-1 shadow-md">
            <div className="bg-popover sticky top-0 mb-1 pb-1">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2 left-2 h-4 w-4" />
                <AppInput
                  className="pl-8"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  autoFocus
                />
              </div>
            </div>

            {options.length === 0 ? (
              <div className="text-muted-foreground p-2 text-center text-sm">
                {isLoading ? 'Loading...' : 'No results found.'}
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={getOptionValue(option)}
                  className="hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => handleSelect(option)}
                >
                  {getOptionLabel(option)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-destructive text-[0.8rem] font-medium">{error}</p>}
    </div>
  );
}
