'use client';

import { StockAgeingDto, StockAgeingRowDto } from '@vyora/types';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { AppDatePicker, DataTable, ColumnDef, TablePagination } from '@/components/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function StockAgeingPage() {
  const [asOfDate, setAsOfDate] = useState<string>('');

  const [data, setData] = useState<StockAgeingDto | null>(null);
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

        const res = await window.vyora.reports.getStockAgeing({
          asOfDate: asOfDate ? new Date(asOfDate) : undefined,
        });

        if (!mounted) return;

        if (res.success && res.data) {
          setData(res.data);
          setPage(1);
        } else {
          setError(res.error || 'Failed to load Stock Ageing report');
          setData(null);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Stock Ageing report');
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

  const columns: ColumnDef<StockAgeingRowDto>[] = useMemo(
    () => [
      { key: 'productName', header: 'Product' },
      { key: 'sku', header: 'SKU' },
      { key: 'unitShortName', header: 'Unit' },
      {
        key: 'totalQuantity',
        header: 'Total Quantity',
        className: 'text-right',
        cell: (row) => row.totalQuantity.toFixed(4),
      },
      {
        key: 'age0To30Qty',
        header: '0-30 Days',
        className: 'text-right',
        cell: (row) => row.age0To30Qty.toFixed(4),
      },
      {
        key: 'age31To60Qty',
        header: '31-60 Days',
        className: 'text-right',
        cell: (row) => row.age31To60Qty.toFixed(4),
      },
      {
        key: 'age61To90Qty',
        header: '61-90 Days',
        className: 'text-right',
        cell: (row) => row.age61To90Qty.toFixed(4),
      },
      {
        key: 'age91To180Qty',
        header: '91-180 Days',
        className: 'text-right',
        cell: (row) => row.age91To180Qty.toFixed(4),
      },
      {
        key: 'age181To365Qty',
        header: '181-365 Days',
        className: 'text-right',
        cell: (row) => row.age181To365Qty.toFixed(4),
      },
      {
        key: 'ageAbove365Qty',
        header: '> 365 Days',
        className: 'text-right',
        cell: (row) => row.ageAbove365Qty.toFixed(4),
      },
      {
        key: 'wacPaise',
        header: 'WAC',
        className: 'text-right',
        cell: (row) => ((row.wacPaise || 0) / 100).toFixed(2),
      },
      {
        key: 'totalValuePaise',
        header: 'Value',
        className: 'text-right',
        cell: (row) => ((row.totalValuePaise || 0) / 100).toFixed(2),
      },
    ],
    [],
  );

  const paginatedRows = useMemo(() => {
    if (!data?.rows) return [];
    const start = (page - 1) * pageSize;
    return data.rows.slice(start, start + pageSize);
  }, [data, page]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stock Ageing Report"
        description="View the age of current inventory layers calculated on a FIFO basis."
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="bg-primary/10 text-card-foreground rounded border p-6">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Grand Total Quantity
              </h3>
              <p className="text-primary mt-2 text-4xl font-bold">
                {data.totalQuantity.toFixed(4)}
              </p>
            </div>
            <div className="bg-primary/10 text-card-foreground rounded border p-6">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Grand Total Value
              </h3>
              <p className="text-primary mt-2 text-4xl font-bold">
                {(data.totalValuePaise / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden overflow-x-auto rounded-md border">
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
