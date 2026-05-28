'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { useHotkeys } from '@/hooks/useHotkeys';
import './command-palette.css';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  // Toggle Command Palette
  useHotkeys('k', () => setOpen((open) => !open));

  // Toggle Theme directly if needed
  useHotkeys('t', () => setTheme(theme === 'dark' ? 'light' : 'dark'), true, true);

  // Close on Escape
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-[15vh] backdrop-blur-sm">
      <Command
        className="border-border bg-popover text-popover-foreground w-full max-w-[600px] overflow-hidden rounded-xl border shadow-2xl"
        label="Global Command Menu"
      >
        <Command.Input
          autoFocus
          placeholder="Type a command or search..."
          className="border-border placeholder:text-muted-foreground w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
        />
        <Command.List className="max-h-[300px] overflow-x-hidden overflow-y-auto p-2">
          <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))}>
              Dashboard
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/sales'))}>
              Sales
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/purchase'))}>
              Purchase
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/inventory'))}>
              Inventory
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/reports'))}>
              Reports
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/settings'))}>
              Settings
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions">
            <Command.Item
              onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            >
              Toggle Theme
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
