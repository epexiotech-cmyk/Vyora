import { clsx, type ClassValue } from 'clsx';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AppDropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export type AppDropdownItemOrSeparator = AppDropdownItem | 'separator';

export interface AppDropdownMenuProps {
  trigger: React.ReactNode;
  items: AppDropdownItemOrSeparator[];
  align?: 'start' | 'end';
}

export function AppDropdownMenu({ trigger, items, align = 'end' }: AppDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          ></div>
          <div
            className={cn(
              'bg-card border-border/50 absolute z-50 mt-1 w-48 rounded-md border py-1 shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, index) => {
              if (item === 'separator') {
                return <div key={`sep-${index}`} className="border-border/50 my-1 border-t" />;
              }

              return (
                <button
                  key={item.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.disabled) return;
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'hover:bg-secondary/50 flex w-full items-center px-3 py-2 text-left text-sm transition-colors',
                    item.disabled && 'cursor-not-allowed opacity-50',
                    item.danger && !item.disabled
                      ? 'text-red-600 hover:text-red-700 dark:text-red-400'
                      : '',
                  )}
                >
                  {item.icon && (
                    <span className="mr-2 flex h-4 w-4 items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
