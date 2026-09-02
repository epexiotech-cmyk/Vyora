'use client';

import { LedgerStatementDto, LedgerStatementRowDto } from '@vyora/types';
import { ExportFormat, ExportColumn } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { AppDatePicker } from '@/components/shared/form/AppDatePicker';
import { AppSelect } from '@/components/shared/form/AppSelect';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function LedgerStatement() {
  const { context: companyContext, loading: companyLoading } = useCompanyContext();
  const [data, setData] = useState<LedgerStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [ledgerId, setLedgerId] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [toDate, setToDate] = useState<Date>(new Date());

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  const [ledgers, setLedgers] = useState<{ label: string; value: string }[]>([
    { label: 'Select Ledger...', value: '' },
  ]);

  useEffect(() => {
    async function loadLedgers() {
      try {
        const res = await window.vyora.accounting.getActiveLedgers();
        if (res.success && res.data) {
          setLedgers([
            { label: 'Select Ledger...', value: '' },
            ...res.data.map((l) => ({ label: l.name, value: l.id })),
          ]);
        }
      } catch (e) {
        console.error('Failed to load ledgers', e);
      }
    }
    loadLedgers();
  }, []);

  useEffect(() => {
    async function load() {
      if (!ledgerId) return;
      setLoading(true);
      try {
        const res = await window.vyora.accounting.getLedgerStatement(ledgerId, fromDate, toDate);
        if (res.success) {
          setData(res.data || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ledgerId, fromDate, toDate]);

  const columns: ColumnDef<LedgerStatementRowDto>[] = [
    { key: 'date', header: 'Date', cell: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'particulars', header: 'Particulars' },
    { key: 'voucherType', header: 'Voucher Type' },
    { key: 'voucherNumber', header: 'Voucher No.' },
    {
      key: 'debitAmount',
      header: 'Debit',
      className: 'text-right',
      cell: (row) => {
        if (companyLoading || !companyContext?.currency) return '';
        return row.debitAmount > 0 ? formatMoney(row.debitAmount, companyContext.currency) : '';
      },
    },
    {
      key: 'creditAmount',
      header: 'Credit',
      className: 'text-right',
      cell: (row) => {
        if (companyLoading || !companyContext?.currency) return '';
        return row.creditAmount > 0 ? formatMoney(row.creditAmount, companyContext.currency) : '';
      },
    },
    {
      key: 'balance',
      header: 'Balance',
      className: 'text-right font-semibold',
      cell: (row) => {
        if (companyLoading || !companyContext?.currency) return '';
        return `${formatMoney(row.balance, companyContext.currency)} ${row.balanceType}`;
      },
    },
  ];

  const { exportData, isExporting } = useExport();

  const handleExport = (format: ExportFormat) => {
    if (!data) return;

    const columns: ExportColumn[] = [
      { key: 'date', header: 'Date', type: 'date' },
      { key: 'particulars', header: 'Particulars' },
      { key: 'voucherType', header: 'Voucher Type' },
      { key: 'voucherNumber', header: 'Voucher No.' },
      { key: 'debit', header: 'Debit', type: 'currency' },
      { key: 'credit', header: 'Credit', type: 'currency' },
      { key: 'balance', header: 'Balance', type: 'string' },
    ];

    const rows = data.rows.map((r) => ({
      date: typeof r.date === 'string' ? new Date(r.date) : r.date,
      particulars: r.particulars,
      voucherType: r.voucherType,
      voucherNumber: r.voucherNumber,
      debit: r.debitAmount || 0,
      credit: r.creditAmount || 0,
      balance: `${r.balance} ${r.balanceType}`,
    }));

    exportData(
      format,
      generateExportFilename('ledger-statement', toDate),
      columns,
      rows,
      {
        title: 'Ledger Statement',
        ledgerId: ledgerId,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      {
        openingBalance: `${data.openingBalance} ${data.openingType}`,
        closingBalance: `${data.closingBalance} ${data.closingType}`,
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Ledger Statement" description="View Ledger Statement" />
        <AppExportDropdown onExport={handleExport} isExporting={isExporting} />
      </div>

      <div className="flex items-center space-x-4">
        <AppSelect
          options={ledgers}
          value={ledgerId}
          onChange={(v) => setLedgerId(typeof v === 'string' ? v : '')}
          placeholder="Select Ledger"
        />
        <AppDatePicker
          label="From Date"
          value={formatDate(fromDate)}
          onChange={(dateStr) => setFromDate(new Date(dateStr))}
        />
        <AppDatePicker
          label="To Date"
          value={formatDate(toDate)}
          onChange={(dateStr) => setToDate(new Date(dateStr))}
        />
      </div>

      {ledgerId && (
        <div className="overflow-hidden rounded-md border">
          {data && !loading && (
            <div className="bg-muted/50 flex justify-between border-b p-4 font-semibold">
              <div>Opening Balance:</div>
              <div>
                {companyContext?.currency
                  ? formatMoney(data.openingBalance, companyContext.currency)
                  : ''}{' '}
                {data.openingType}
              </div>
            </div>
          )}
          <DataTable
            data={data?.rows || []}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={loading}
          />
          {data && !loading && (
            <div className="bg-muted/50 flex justify-between border-t p-4 font-semibold">
              <div>Closing Balance:</div>
              <div>
                {companyContext?.currency
                  ? formatMoney(data.closingBalance, companyContext.currency)
                  : ''}{' '}
                {data.closingType}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
