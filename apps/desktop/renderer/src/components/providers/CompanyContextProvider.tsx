'use client';

import { CompanyContextDto } from '@vyora/types';
import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CompanyContextState {
  context: CompanyContextDto | null;
  loading: boolean;
  error: Error | null;
  refresh(): Promise<void>;
}

const CompanyContext = createContext<CompanyContextState | undefined>(undefined);

export function CompanyContextProvider({ children }: { children: React.ReactNode }) {
  const isBrowserMissingVyora = typeof window !== 'undefined' && !window.vyora?.company?.getContext;

  const [contextState, setContextState] = useState<CompanyContextDto | null>(null);
  const [loading, setLoading] = useState(!isBrowserMissingVyora);
  const [error, setError] = useState<Error | null>(
    isBrowserMissingVyora
      ? new Error('Vyora API not available (are you running in a browser instead of Electron?)')
      : null,
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.vyora?.company?.getContext) {
        throw new Error(
          'Vyora API not available (are you running in a browser instead of Electron?)',
        );
      }
      const response = await window.vyora.company.getContext();
      if (response.success && response.data) {
        setContextState(response.data);
      } else {
        setContextState(null);
        if (response.error) {
          setError(new Error(response.error));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch company context'));
      setContextState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (isBrowserMissingVyora) return;

    window.vyora.company
      .getContext()
      .then((response) => {
        if (!mounted) return;
        if (response.success && response.data) {
          setContextState(response.data);
        } else {
          setContextState(null);
          if (response.error) {
            setError(new Error(response.error));
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch company context'));
        setContextState(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isBrowserMissingVyora]);

  const value: CompanyContextState = React.useMemo(
    () => ({
      context: contextState,
      loading,
      error,
      refresh,
    }),
    [contextState, loading, error, refresh],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyContextProvider');
  }
  return context;
}

export function useCurrency() {
  const { context } = useCompanyContext();
  if (!context?.currency) {
    // Fallback or error. For now, provide a basic fallback if context isn't loaded yet.
    return {
      currencyCode: 'INR',
      currencyName: 'Indian Rupee',
      symbol: '₹',
      locale: 'en-IN',
      decimalPlaces: 2,
      symbolPosition: 'PREFIX',
    };
  }
  return context.currency;
}
