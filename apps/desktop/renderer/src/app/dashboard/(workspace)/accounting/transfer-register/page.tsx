'use client';

import {
  TransferRegisterReportDto,
  PaymentAccountDto,
  TransferRegisterEntryDto,
} from '@vyora/types';
import { ExportFormat, ExportColumn } from '@vyora/types';
import { formatMoney, getEndOfDay } from '@vyora/utils';
import { Edit2, XCircle, Search, Filter, X, ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { CancelTransferDialog } from '../_components/CancelTransferDialog';
import { TransferDialog } from '../_components/TransferDialog';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { AppDatePicker } from '@/components/shared/form/AppDatePicker';
import { AppSelect } from '@/components/shared/form/AppSelect';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { AppInput } from '@/components/ui/AppInput';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function TransferRegisterPage() {
  const { context: companyContext, loading: companyLoading } = useCompanyContext();
  const [data, setData] = useState<TransferRegisterReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [toDate, setToDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountDto[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [fromAccountId, setFromAccountId] = useState<string>('ALL');
  const [toAccountId, setToAccountId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { exportData, isExporting } = useExport();

  const handleExport = (format: ExportFormat) => {
    const columns: ExportColumn[] = [
      { key: 'date', header: 'Date', type: 'date' },
      { key: 'voucherNumber', header: 'Voucher No.' },
      { key: 'source', header: 'Source' },
      { key: 'destination', header: 'Destination' },
      { key: 'amount', header: 'Amount', type: 'currency' },
      { key: 'status', header: 'Status' },
      { key: 'narration', header: 'Narration' },
    ];

    const rows = filteredEntries.map((e) => {
      const sourceName =
        paymentAccounts.find((p) => p.ledgerId === e.sourceLedgerId)?.displayName ||
        e.sourceLedgerId;
      const destName =
        paymentAccounts.find((p) => p.ledgerId === e.destinationLedgerId)?.displayName ||
        e.destinationLedgerId;

      return {
        date: typeof e.transferDate === 'string' ? new Date(e.transferDate) : e.transferDate,
        voucherNumber: e.voucherNumber,
        source: sourceName,
        destination: destName,
        amount: e.amount || 0,
        status: e.isCancelled ? 'Cancelled' : 'Active',
        narration: e.narration || '',
      };
    });

    exportData(format, generateExportFilename('transfer-register', toDate), columns, rows, {
      title: 'Transfer Register',
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      filters: {
        searchQuery,
        statusFilter,
        fromAccountId,
        toAccountId,
        minAmount,
        maxAmount,
      },
    });
  };

  useEffect(() => {
    let mounted = true;
    window.vyora.paymentAccounts
      .search({})
      .then((accounts) => {
        if (mounted) setPaymentAccounts(accounts);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  const [editTransfer, setEditTransfer] = useState<{
    voucherId: string;
    fromPaymentAccountId: string;
    toPaymentAccountId: string;
    amount: number;
    transferDate: Date;
    narration?: string;
  } | null>(null);

  const [cancelTransfer, setCancelTransfer] = useState<{
    voucherId: string;
    voucherNumber: string;
    amountFormatted: string;
    sourceAccount: string;
    destinationAccount: string;
  } | null>(null);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setError(null);

      try {
        const res = await window.vyora.reports.getTransferRegister({
          startDate: fromDate,
          endDate: getEndOfDay(toDate),
        });
        setData(res);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to fetch Transfer Register');
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [fromDate, toDate, refreshKey]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (fromAccountId !== 'ALL') count++;
    if (toAccountId !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (minAmount !== '') count++;
    if (maxAmount !== '') count++;
    return count;
  }, [fromAccountId, toAccountId, statusFilter, minAmount, maxAmount]);

  const clearFilters = () => {
    setSearchQuery('');
    setFromAccountId('ALL');
    setToAccountId('ALL');
    setStatusFilter('ALL');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const filteredEntries = (() => {
    if (!data?.entries) return [];

    let entries = data.entries;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.voucherNumber.toLowerCase().includes(q) ||
          e.sourceAccountName.toLowerCase().includes(q) ||
          e.destinationAccountName.toLowerCase().includes(q) ||
          (e.narration && e.narration.toLowerCase().includes(q)) ||
          (e.amount / 100).toString().includes(q),
      );
    }

    // Account filters
    if (fromAccountId !== 'ALL') {
      const pa = paymentAccounts.find((p) => p.id === fromAccountId);
      if (pa) {
        entries = entries.filter((e) => e.sourceLedgerId === pa.ledgerId);
      }
    }
    if (toAccountId !== 'ALL') {
      const pa = paymentAccounts.find((p) => p.id === toAccountId);
      if (pa) {
        entries = entries.filter((e) => e.destinationLedgerId === pa.ledgerId);
      }
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      entries = entries.filter((e) => !e.isCancelled);
    } else if (statusFilter === 'CANCELLED') {
      entries = entries.filter((e) => e.isCancelled);
    }

    // Amount range
    if (minAmount !== '') {
      const min = parseFloat(minAmount) * 100;
      if (!isNaN(min)) {
        entries = entries.filter((e) => e.amount >= min);
      }
    }
    if (maxAmount !== '') {
      const max = parseFloat(maxAmount) * 100;
      if (!isNaN(max)) {
        entries = entries.filter((e) => e.amount <= max);
      }
    }

    return entries;
  })();

  const totalFilteredAmount = (() => {
    return filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  })();

  const paginatedEntries = (() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  })();

  // Removed unnecessary useEffect that called setPage(1) synchronously

  const columns: ColumnDef<TransferRegisterEntryDto>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (rowData) => {
        return (
          <div>
            <div className="text-sm font-medium">
              {new Date(rowData.transferDate).toLocaleDateString()}
            </div>
            <div className="text-muted-foreground text-xs">{rowData.voucherNumber}</div>
          </div>
        );
      },
    },
    {
      key: 'transfer',
      header: 'Transfer Details',
      cell: (rowData) => {
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-medium">
              <span>{rowData.sourceAccountName}</span>
              <ArrowRight className="text-muted-foreground h-4 w-4" />
              <span>{rowData.destinationAccountName}</span>
            </div>
            <div
              className="text-muted-foreground text-xs italic"
              title={rowData.narration || 'No narration'}
            >
              {rowData.narration || 'No narration'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: (rowData) => {
        if (companyLoading || !companyContext?.currency) return '';
        return (
          <div className="text-base font-semibold">
            {formatMoney(rowData.amount, companyContext.currency)}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (rowData) => {
        if (rowData.isCancelled) {
          return <StatusBadge variant="destructive">Cancelled</StatusBadge>;
        }
        return (
          <StatusBadge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Active
          </StatusBadge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (rowData) => {
        if (rowData.isCancelled) return null;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Edit Transfer"
              onClick={() => {
                const sourcePa = paymentAccounts.find(
                  (pa) => pa.ledgerId === rowData.sourceLedgerId,
                );
                const destPa = paymentAccounts.find(
                  (pa) => pa.ledgerId === rowData.destinationLedgerId,
                );

                if (!sourcePa || !destPa) {
                  toast.error(
                    'Cannot edit this transfer. Original payment accounts could not be resolved.',
                  );
                  return;
                }

                setEditTransfer({
                  voucherId: rowData.voucherId,
                  fromPaymentAccountId: sourcePa.id,
                  toPaymentAccountId: destPa.id,
                  amount: rowData.amount,
                  transferDate: new Date(rowData.transferDate),
                  narration: rowData.narration,
                });
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Cancel Transfer"
              onClick={() =>
                setCancelTransfer({
                  voucherId: rowData.voucherId,
                  voucherNumber: rowData.voucherNumber,
                  amountFormatted: companyContext?.currency
                    ? formatMoney(rowData.amount, companyContext.currency)
                    : String(rowData.amount),
                  sourceAccount: rowData.sourceAccountName,
                  destinationAccount: rowData.destinationAccountName,
                })
              }
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const accountOptions = [
    { label: 'All Accounts', value: 'ALL' },
    ...paymentAccounts.map((pa) => ({ label: pa.displayName, value: pa.id })),
  ];

  const statusOptions = [
    { label: 'All Transfers', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transfer Register"
        description="Log of internal fund transfers between accounts"
      />

      <div className="bg-card space-y-4 rounded-lg border p-4 shadow-sm">
        {/* Top Toolbar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[140px]">
              <AppDatePicker
                label="From Date"
                value={formatDate(fromDate)}
                onChange={(val) => setFromDate(new Date(val))}
              />
            </div>
            <div className="w-[140px]">
              <AppDatePicker
                label="To Date"
                value={formatDate(toDate)}
                onChange={(val) => setToDate(new Date(val))}
              />
            </div>
            <div className="relative mt-5">
              <Search className="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
              <input
                type="text"
                placeholder="Search transfers..."
                className="border-input bg-background/50 focus-visible:ring-ring h-8 w-[200px] rounded-sm border py-1 pr-4 pl-9 text-sm focus-visible:ring-1 focus-visible:outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AppExportDropdown onExport={handleExport} isExporting={isExporting} />
            <Button
              variant={activeFiltersCount > 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-8"
              >
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="animate-in slide-in-from-top-2 fade-in grid grid-cols-1 gap-4 border-t pt-4 duration-200 sm:grid-cols-2 md:grid-cols-4">
            <AppSelect
              label="From Account"
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                setPage(1);
              }}
              options={accountOptions}
            />
            <AppSelect
              label="To Account"
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                setPage(1);
              }}
              options={accountOptions}
            />
            <AppSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'CANCELLED');
                setPage(1);
              }}
              options={statusOptions}
            />
            <div className="space-y-1.5">
              <label className="text-foreground text-sm leading-none font-medium">
                Amount Range
              </label>
              <div className="flex items-center gap-2">
                <AppInput
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  className="h-8"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <AppInput
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground text-sm font-medium">
          Showing {filteredEntries.length} transfer(s)
        </div>
        <div className="text-sm font-medium">
          Total Amount:{' '}
          {companyContext?.currency
            ? formatMoney(totalFilteredAmount, companyContext.currency)
            : totalFilteredAmount}
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-md border shadow-sm">
        {error ? (
          <div className="text-destructive p-8 text-center">{error}</div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedEntries}
            isLoading={loading}
            emptyMessage={
              filteredEntries.length === 0 && data?.entries?.length
                ? 'No transfers match your filters.'
                : 'No transfers found in this period.'
            }
            keyExtractor={(row) => String(row.voucherId)}
            pagination={{
              page,
              pageSize,
              totalRecords: filteredEntries.length,
              onPageChange: setPage,
              onPageSizeChange: (sz) => {
                setPageSize(sz);
                setPage(1);
              },
            }}
          />
        )}
      </div>

      <TransferDialog
        isOpen={!!editTransfer}
        onClose={() => setEditTransfer(null)}
        selectedAccountId={editTransfer?.fromPaymentAccountId || null}
        selectedAccountName={
          data?.entries?.find((e) => e.voucherId === editTransfer?.voucherId)?.sourceAccountName ||
          ''
        }
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
        initialData={editTransfer || undefined}
      />

      <CancelTransferDialog
        isOpen={!!cancelTransfer}
        onClose={() => setCancelTransfer(null)}
        voucherId={cancelTransfer?.voucherId || null}
        voucherNumber={cancelTransfer?.voucherNumber || ''}
        amountFormatted={cancelTransfer?.amountFormatted || ''}
        sourceAccount={cancelTransfer?.sourceAccount || ''}
        destinationAccount={cancelTransfer?.destinationAccount || ''}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
