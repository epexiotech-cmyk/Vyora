'use client';

import { AccountBalanceSummaryDto, PaymentAccountBalanceDto } from '@vyora/types';
import { ExportFormat, ExportColumn } from '@vyora/types';
import { formatMoney, getEndOfDay } from '@vyora/utils';
import {
  Building2,
  Wallet,
  Smartphone,
  CreditCard,
  ArrowRightLeft,
  ArrowRight,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { TransferDialog } from '../_components/TransferDialog';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { AppDatePicker } from '@/components/shared/form/AppDatePicker';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

type BookType = 'BANK' | 'CASH' | 'UPI' | 'POS';

type UnifiedBookData = {
  openingBalance: { amount: number; type: string } | number;
  closingBalance: { amount: number; type: string } | number;
  vouchers?: Record<string, unknown>[];
  entries?: Record<string, unknown>[];
};

interface ActivityRow {
  id?: string | number;
  voucherId?: string;
  voucherDate: string | number | Date;
  voucherNumber: string;
  voucherType: string;
  isCancelled?: boolean;
  narration?: string | null;
  debitAmount?: number;
  creditAmount?: number;
  [key: string]: unknown;
}

const ICONS = {
  BANK: Building2,
  CASH: Wallet,
  UPI: Smartphone,
  POS: CreditCard,
};

const renderBalance = (amount: number, type: string, baseClassName = '') => {
  if (amount === 0) {
    return <span className={`text-muted-foreground ${baseClassName}`}>₹0.00</span>;
  }
  const isPositive = type === 'DR' || type === 'Dr';
  const prefix = isPositive ? '+' : '−';
  const colorClass = isPositive
    ? 'text-green-600 dark:text-green-500'
    : 'text-red-600 dark:text-red-500';
  return (
    <span className={`${colorClass} ${baseClassName}`}>
      {prefix}
      {formatMoney(amount)}
    </span>
  );
};

export default function AccountBalanceSummaryPage() {
  const { context: companyContext } = useCompanyContext();

  const formatDateForPicker = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [asOfDate, setAsOfDate] = useState<Date>(new Date());

  // Data States
  const [summaryData, setSummaryData] = useState<AccountBalanceSummaryDto | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [bookData, setBookData] = useState<UnifiedBookData | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  // Selected State
  const [selectedType, setSelectedType] = useState<BookType>('BANK');
  const [manualAccountId, setManualAccountId] = useState<string | null>(null);

  // Transfer State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { exportData, isExporting } = useExport();

  const handleExport = (format: ExportFormat) => {
    if (!selectedAccountDetails) return;

    const columns: ExportColumn[] = [
      { key: 'date', header: 'Date', type: 'date' },
      { key: 'voucherNumber', header: 'Voucher No.' },
      { key: 'type', header: 'Type' },
      { key: 'narration', header: 'Narration' },
      { key: 'debit', header: 'Debit', type: 'currency' },
      { key: 'credit', header: 'Credit', type: 'currency' },
    ];

    const rows = normalizedEntries.map((e) => ({
      date: typeof e.voucherDate === 'string' ? new Date(e.voucherDate) : e.voucherDate,
      voucherNumber: e.voucherNumber,
      type: e.voucherType,
      narration: e.narration,
      debit: e.debitAmount || 0,
      credit: e.creditAmount || 0,
    }));

    exportData(
      format,
      generateExportFilename('account-balance-summary', asOfDate),
      columns,
      rows,
      {
        title: 'Account Balance Summary',
        accountName: selectedAccountDetails.accountName,
        accountType: selectedAccountDetails.accountType,
        asOfDate: asOfDate.toISOString(),
      },
      {
        debit: selectedAccountDetails.debitTotal,
        credit: selectedAccountDetails.creditTotal,
      },
    );
  };

  // 1. Fetch Summary Data
  useEffect(() => {
    let mounted = true;
    async function fetchSummary() {
      if (!companyContext) return;
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const res = await window.vyora.reports.getAccountBalanceSummary(getEndOfDay(asOfDate));
        if (mounted) setSummaryData(res);
      } catch (err) {
        if (mounted)
          setSummaryError(err instanceof Error ? err.message : 'Failed to fetch summary');
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }
    fetchSummary();
    return () => {
      mounted = false;
    };
  }, [asOfDate, companyContext, refreshKey]);

  // Derived Account Groupings
  const accountsByType = useMemo(() => {
    const grouped = {
      CASH: [] as PaymentAccountBalanceDto[],
      BANK: [] as PaymentAccountBalanceDto[],
      UPI: [] as PaymentAccountBalanceDto[],
      POS: [] as PaymentAccountBalanceDto[],
    };
    if (summaryData?.accounts) {
      for (const acc of summaryData.accounts) {
        if (grouped[acc.accountType as BookType]) {
          grouped[acc.accountType as BookType].push(acc);
        }
      }
    }
    return grouped;
  }, [summaryData]);

  // Smart Default Selection Derived State
  const activeAccountId = useMemo(() => {
    const accounts = accountsByType[selectedType];
    if (accounts.length === 0) return null;

    if (manualAccountId && accounts.some((a) => a.accountId === manualAccountId)) {
      return manualAccountId;
    }

    const defaultAccount = accounts.find((a) => a.isDefault);
    if (defaultAccount) return defaultAccount.accountId;

    return accounts[0].accountId;
  }, [accountsByType, selectedType, manualAccountId]);

  let selectedAccountDetails: PaymentAccountBalanceDto | null = null;
  if (activeAccountId && summaryData) {
    selectedAccountDetails =
      summaryData.accounts.find((a) => a.accountId === activeAccountId) || null;
  }

  // 2. Fetch Book Activity
  useEffect(() => {
    let mounted = true;
    async function fetchBook() {
      if (!selectedAccountDetails) {
        if (mounted) setBookData(null);
        return;
      }
      setLoadingBook(true);
      setBookError(null);
      try {
        const args = {
          ledgerId: selectedAccountDetails.ledgerId,
          endDate: getEndOfDay(asOfDate),
        };

        let res;
        switch (selectedType) {
          case 'BANK':
            res = await window.vyora.reports.getBankBook(args);
            break;
          case 'CASH':
            res = await window.vyora.reports.getCashBook(args);
            break;
          case 'UPI':
            res = await window.vyora.reports.getUpiBook(args);
            break;
          case 'POS':
            res = await window.vyora.reports.getPosBook(args);
            break;
        }
        if (mounted) setBookData(res as unknown as UnifiedBookData);
      } catch (err) {
        if (mounted) setBookError(err instanceof Error ? err.message : 'Failed to fetch book');
      } finally {
        if (mounted) setLoadingBook(false);
      }
    }
    fetchBook();
    return () => {
      mounted = false;
    };
  }, [selectedAccountDetails, asOfDate, selectedType, refreshKey]);

  const normalizedEntries = (() => {
    if (!bookData) return [];

    // If UPI style (already flattened)
    if (bookData.entries && bookData.entries.length > 0) {
      return bookData.entries as ActivityRow[];
    }

    // If Cash/Bank/POS style (vouchers with nested entries)
    if (bookData.vouchers && bookData.vouchers.length > 0 && selectedAccountDetails) {
      return bookData.vouchers.map((v) => {
        let debitAmount = 0;
        let creditAmount = 0;
        let narration: string | null = null;
        const vRow = v as ActivityRow;

        const nestedEntries = (v.entries as Record<string, unknown>[]) || [];
        nestedEntries.forEach((e) => {
          if (e.ledgerId === selectedAccountDetails.ledgerId) {
            debitAmount += Number(e.debitAmount || 0);
            creditAmount += Number(e.creditAmount || 0);
            if (e.narration) {
              narration = String(e.narration);
            }
          }
        });

        if (!narration && vRow.narration) {
          narration = String(vRow.narration);
        }

        return {
          ...vRow,
          id: String(vRow.voucherId || vRow.id),
          debitAmount,
          creditAmount,
          narration,
        };
      });
    }

    return [];
  })();

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Payment Accounts"
          description="Unified workspace for your cash, bank, and digital payment accounts"
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">As of Date</span>
            <AppDatePicker
              value={formatDateForPicker(asOfDate)}
              onChange={(val) => {
                if (val) setAsOfDate(new Date(val));
              }}
            />
          </div>
          <AppExportDropdown onExport={handleExport} isExporting={isExporting} />
          <Button onClick={() => setIsTransferModalOpen(true)} size="sm">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </div>
      </div>

      {loadingSummary && !summaryData ? (
        <div className="text-muted-foreground text-sm">Loading accounts...</div>
      ) : summaryError ? (
        <div className="text-destructive text-sm">{summaryError}</div>
      ) : (
        <>
          {/* Account Type Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {(['CASH', 'BANK', 'UPI', 'POS'] as BookType[]).map((type) => {
              const accounts = accountsByType[type];
              const isSelected = selectedType === type;
              const Icon = ICONS[type];

              // Display Logic:
              // If this card is the selected type, it shows the active account.
              // If this card is not selected, it shows its default or first account.
              let displayedAccount = null;
              if (isSelected && activeAccountId) {
                displayedAccount = accounts.find((a) => a.accountId === activeAccountId) || null;
              } else if (accounts.length > 0) {
                displayedAccount = accounts.find((a) => a.isDefault) || accounts[0];
              }

              return (
                <div
                  key={type}
                  className={`bg-card text-card-foreground cursor-pointer rounded-lg border p-4 shadow-sm transition-colors ${isSelected ? 'ring-primary border-primary ring-2' : 'hover:border-primary/50 opacity-80 hover:opacity-100'} ${accounts.length === 0 ? 'pointer-events-none opacity-50 grayscale' : ''}`}
                  onClick={() => {
                    if (accounts.length > 0) setSelectedType(type);
                  }}
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4" />
                      {type}
                    </div>
                    <div className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-semibold">
                      {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
                    </div>
                  </div>
                  <div>
                    {accounts.length === 0 ? (
                      <div className="text-muted-foreground mt-2 text-sm">No active accounts</div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {accounts.length === 1 ? (
                          <div
                            className="truncate text-sm font-semibold"
                            title={accounts[0].accountName}
                          >
                            {accounts[0].accountName}
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              if (isSelected) e.stopPropagation();
                            }}
                          >
                            <select
                              className="w-full rounded border p-1 text-sm font-semibold"
                              value={displayedAccount?.accountId || ''}
                              onChange={(e) => {
                                setSelectedType(type);
                                setManualAccountId(e.target.value);
                              }}
                            >
                              {accounts.map((acc) => (
                                <option key={acc.accountId} value={acc.accountId}>
                                  {acc.accountName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="mt-2 text-2xl font-bold">
                          {displayedAccount ? (
                            renderBalance(
                              displayedAccount.closingBalance.amount,
                              displayedAccount.closingBalance.type,
                            )
                          ) : (
                            <span className="text-muted-foreground">₹0.00</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Account Detail */}
          {selectedAccountDetails && (
            <div className="bg-card text-card-foreground mt-8 rounded-lg border p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-bold">{selectedAccountDetails.accountName}</h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedAccountDetails.accountType} Account
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {renderBalance(
                        selectedAccountDetails.closingBalance.amount,
                        selectedAccountDetails.closingBalance.type,
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Closing Balance as of {asOfDate.toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8 md:gap-12 md:border-l md:pl-12">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">Opening Balance</p>
                    <p className="text-lg font-semibold">
                      {formatMoney(selectedAccountDetails.openingBalance.amount)}
                      <span className="text-muted-foreground ml-1 text-xs">
                        {selectedAccountDetails.openingBalance.type}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">Total Debit</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-500">
                      {formatMoney(selectedAccountDetails.debitTotal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">Total Credit</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-500">
                      {formatMoney(selectedAccountDetails.creditTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Activity */}
          {selectedAccountDetails && (
            <div className="mt-8">
              <SectionHeader
                title="Account Activity"
                description={`Recent transactions for ${selectedAccountDetails.accountName}`}
                className="mb-4"
              />
              {loadingBook ? (
                <div className="text-muted-foreground text-sm">Loading activity...</div>
              ) : bookError ? (
                <div className="text-destructive text-sm">{bookError}</div>
              ) : normalizedEntries.length > 0 ? (
                <div className="bg-card overflow-hidden rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 border-b">
                        <tr>
                          <th className="text-muted-foreground border-r px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase">
                            Date
                          </th>
                          <th className="text-muted-foreground border-r px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase">
                            Voucher No.
                          </th>
                          <th className="text-muted-foreground border-r px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase">
                            Type
                          </th>
                          <th className="text-muted-foreground min-w-[220px] border-r px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase">
                            Narration
                          </th>
                          <th className="text-muted-foreground w-36 border-r px-4 py-2.5 text-right text-[11px] font-semibold tracking-wider uppercase">
                            Debit
                          </th>
                          <th className="text-muted-foreground w-36 px-4 py-2.5 text-right text-[11px] font-semibold tracking-wider uppercase">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {normalizedEntries.map((row, index) => (
                          <tr
                            key={row.id || row.voucherId || `fallback-${index}`}
                            className="hover:bg-muted/50 border-b transition-colors last:border-0"
                          >
                            <td className="border-r px-4 py-2.5 align-middle whitespace-nowrap">
                              {new Date(row.voucherDate).toLocaleDateString()}
                            </td>
                            <td className="border-r px-4 py-2.5 align-middle font-medium whitespace-nowrap">
                              {row.voucherNumber}
                            </td>
                            <td className="border-r px-4 py-2.5 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{String(row.voucherType).replace(/_/g, ' ')}</span>
                                {Boolean(row.isCancelled) && (
                                  <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="max-w-[250px] border-r px-4 py-2.5 align-middle">
                              {(() => {
                                const isContra = String(row.voucherType).toUpperCase() === 'CONTRA';
                                const narrationStr = row.narration || '—';

                                if (isContra && narrationStr.includes(' → ')) {
                                  const parts = narrationStr.split('\n');
                                  const transferLine = parts[0];
                                  const customNarration = parts.slice(1).join('\n');
                                  const [source, dest] = transferLine.split(' → ');

                                  return (
                                    <div className="flex flex-col gap-1">
                                      <div className="text-foreground flex items-center gap-2 font-medium">
                                        <span className="truncate">{source}</span>
                                        <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
                                        <span className="truncate">{dest}</span>
                                      </div>
                                      {customNarration && (
                                        <div
                                          className="text-muted-foreground truncate text-xs italic"
                                          title={customNarration}
                                        >
                                          {customNarration}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    className="text-muted-foreground truncate"
                                    title={narrationStr}
                                  >
                                    {narrationStr}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="border-r px-4 py-2.5 text-right align-middle whitespace-nowrap tabular-nums">
                              {formatMoney(Number(row.debitAmount || 0))}
                            </td>
                            <td className="px-4 py-2.5 text-right align-middle whitespace-nowrap tabular-nums">
                              {formatMoney(Number(row.creditAmount || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground bg-muted/20 rounded-lg border p-8 text-center text-sm">
                  No activity found for this account in the current month.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedAccountDetails && (
        <TransferDialog
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          selectedAccountId={selectedAccountDetails.accountId}
          selectedAccountName={selectedAccountDetails.accountName}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
