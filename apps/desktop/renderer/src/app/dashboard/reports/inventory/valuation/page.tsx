'use client';

import { StockSummaryDto, StockSummaryRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppDatePicker, DataTable, ColumnDef, TablePagination } from '@/components/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function InventoryValuationPage() {
  const { context: companyContext } = useCompanyContext();
  const [asOfDate, setAsOfDate] = useState<string>('');

  const [data, setData] = useState<StockSummaryDto | null>(null);
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

        const res = await window.vyora.reports.getStockSummary({
          asOfDate: asOfDate ? new Date(asOfDate) : undefined,
        });

        if (!mounted) return;

        if (res.success && res.data) {
          setData(res.data);
          setPage(1);
        } else {
          setError(res.error || 'Failed to load Inventory Valuation');
          setData(null);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Inventory Valuation');
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
  }, [asOfDate]);

  const columns: ColumnDef<StockSummaryRowDto>[] = useMemo(
    () => [
      { key: 'productName', header: 'Product' },
      { key: 'sku', header: 'SKU' },
      { key: 'unitShortName', header: 'Unit' },
      {
        key: 'closingQuantity',
        header: 'Closing Quantity',
        className: 'text-right',
        cell: (row) => row.closingQuantity.toFixed(4),
      },
      {
        key: 'wacPaise',
        header: 'Weighted Average Cost',
        className: 'text-right',
        cell: (row) => formatMoney(row.wacPaise, companyContext!.currency),
      },
      {
        key: 'totalValuePaise',
        header: 'Inventory Value',
        className: 'text-right',
        cell: (row) => formatMoney(row.totalValuePaise, companyContext!.currency),
      },
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
        title="Inventory Valuation"
        description="View the weighted average cost valuation of current inventory."
      />

      <div className="bg-muted/20 flex items-end space-x-4 rounded border p-4">
        <div className="w-48">
          <AppDatePicker label="As Of Date" value={asOfDate} onChange={setAsOfDate} />
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500 bg-red-50 p-4 font-bold text-red-500">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-primary/10 text-card-foreground rounded border p-6">
            <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Grand Total Inventory Value
            </h3>
            <p className="text-primary mt-2 text-4xl font-bold">
              {formatMoney(data.totalValuePaise, companyContext!.currency)}
            </p>
          </div>

          <div className="overflow-hidden rounded-md border">
            <DataTable
              data={paginatedRows}
              columns={columns}
              keyExtractor={(item) => item.productId}
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
