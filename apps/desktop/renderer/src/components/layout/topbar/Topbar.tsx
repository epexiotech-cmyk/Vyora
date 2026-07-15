'use client';

import { Search, User, RefreshCcw } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';

export function Topbar() {
  const [companyName, setCompanyName] = useState<string>('Loading...');

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await window.vyora.company.getContext();
        if (response.success && response.data) {
          const { company } = response.data;
          setCompanyName(company.tradeName || company.legalName);
        } else {
          setCompanyName('No Active Company');
        }
      } catch (error) {
        console.error('Failed to load active company', error);
        setCompanyName('No Active Company');
      }
    };
    loadCompany();
  }, []);

  return (
    <header className="bg-glass-bg sticky top-0 z-30 flex h-[var(--header-height)] shrink-0 items-center justify-between border-b px-4 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-4">
        {/* Search Placeholder */}
        <div className="relative hidden w-full max-w-sm items-center md:flex">
          <Search className="text-muted-foreground absolute left-2.5 h-4 w-4" />
          <AppInput
            type="search"
            placeholder="Search (Ctrl+K)..."
            className="bg-background/50 border-border/50 h-7 w-full pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Status Indicators */}
        <div className="text-muted-foreground mr-2 hidden items-center gap-3 text-xs sm:flex">
          <div className="border-success/20 bg-success/10 text-success dark:text-success-bright flex items-center gap-1.5 rounded-sm border px-2 py-1">
            <span className="bg-online h-1.5 w-1.5 animate-pulse rounded-full"></span>
            <span className="font-medium">DB Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCcw className="h-3 w-3" />
            <span>Synced</span>
          </div>
        </div>

        {/* Company Switcher Placeholder */}
        <div className="bg-secondary border-border/50 hover:bg-secondary/80 hidden cursor-pointer rounded-sm border px-2 py-1 text-xs font-medium transition-colors sm:flex">
          {companyName}
        </div>

        <ThemeToggle />

        {/* User Profile Placeholder */}
        <AppButton variant="ghost" size="icon" className="bg-secondary/50 h-8 w-8 rounded-full">
          <User className="text-muted-foreground h-4 w-4" />
        </AppButton>
      </div>
    </header>
  );
}
