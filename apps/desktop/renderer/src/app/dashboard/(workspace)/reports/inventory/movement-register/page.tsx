'use client';

import { StockMovementRegisterDto, StockMovementRegisterRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppDatePicker, DataTable, ColumnDef, TablePagination } from '@/components/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function StockMovementRegisterPage() {
  const { context: companyContext } = useCompanyContext();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [data, setData] = useState<StockMovementRegisterDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await window.vyora.reports.getStockMovementRegister({
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate: toDate ? new Date(toDate) : undefined,
        });

        if (!mounted) return;

        if (res.success && res.data) {
          setData(res.data);
          setPage(1);
        } else {
          setError(res.error || 'Failed to load Stock Movement Register');
          setData(null);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Stock Movement Register');
        }
        setData(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [fromDate, toDate]);

  const columns: ColumnDef<StockMovementRegisterRowDto>[] = useMemo(
    () => [
      {
        key: 'movementDate',
        header: 'Date',
        cell: (row) => new Date(row.movementDate).toLocaleDateString(),
      },
      { key: 'productName', header: 'Product' },
      { key: 'voucherType', header: 'Voucher Type' },
      { key: 'voucherNo', header: 'Voucher No' },
      { key: 'movementType', header: 'Movement Type' },
      {
        key: 'qtyIn',
        header: 'Qty In',
        className: 'text-right',
        cell: (row) => (row.qtyIn > 0 ? row.qtyIn.toFixed(4) : '-'),
      },
      {
        key: 'qtyOut',
        header: 'Qty Out',
        className: 'text-right',
        cell: (row) => (row.qtyOut > 0 ? row.qtyOut.toFixed(4) : '-'),
      },
      {
        key: 'ratePaise',
        header: 'Rate',
        className: 'text-right',
        cell: (row) => (row.ratePaise ? formatMoney(row.ratePaise, companyContext?.currency) : '-'),
      },
      { key: 'remarks', header: 'Remarks' },
    ],
    [companyContext],
  );

  const paginatedRows = useMemo(() => {
    if (!data?.rows) return [];
    const start = (page - 1) * pageSize;
    return data.rows.slice(start, start + pageSize);
  }, [data, page]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stock Movement Register"
        description="View chronological stock movements across all inventory items."
      />

      <div className="bg-muted/20 flex items-end space-x-4 rounded border p-4">
        <div className="w-48">
          <AppDatePicker label="From Date" value={fromDate} onChange={setFromDate} />
        </div>
        <div className="w-48">
          <AppDatePicker label="To Date" value={toDate} onChange={setToDate} />
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500 bg-red-50 p-4 font-bold text-red-500">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-md border">
            <DataTable
              data={paginatedRows}
              columns={columns}
              keyExtractor={(item) => item.movementId}
              isLoading={loading}
            />
          </div>

          <div className="flex justify-end">
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalRecords={data.rows.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
