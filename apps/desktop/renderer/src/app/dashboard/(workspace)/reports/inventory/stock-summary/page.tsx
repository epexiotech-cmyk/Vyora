'use client';

import { StockSummaryDto, StockSummaryRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function StockSummaryPage() {
  const { context: companyContext } = useCompanyContext();
  const [data, setData] = useState<StockSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    async function load() {
      try {
        const res = await window.vyora.reports.getStockSummary();
        if (res.success) {
          setData(res.data || null);
        } else {
          setError(res.error || 'Failed to load Stock Summary');
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Stock Summary');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        header: 'WAC',
        className: 'text-right',
        cell: (row) => formatMoney(row.wacPaise, companyContext?.currency),
      },
      {
        key: 'totalValuePaise',
        header: 'Inventory Value',
        className: 'text-right',
        cell: (row) => formatMoney(row.totalValuePaise, companyContext?.currency),
      },
    ],
    [companyContext],
  );

  const paginatedRows = useMemo(() => {
    if (!data?.rows) return [];
    const start = (page - 1) * pageSize;
    return data.rows.slice(start, start + pageSize);
  }, [data, page]);

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Stock Summary" description="View Stock Summary" />
        <div className="rounded border border-red-500 bg-red-50 p-4 font-bold text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stock Summary"
        description="View consolidated stock balances and valuation for all items"
      />

      <div className="overflow-hidden rounded-md border">
        <DataTable
          data={paginatedRows}
          columns={columns}
          keyExtractor={(item) => item.productId}
          isLoading={loading}
          pagination={{
            page,
            pageSize,
            totalRecords: data?.rows.length || 0,
            onPageChange: setPage,
          }}
        />
        {!loading && data && (
          <div className="bg-muted/50 flex items-center justify-between border-t p-4 font-bold">
            <div>Total Inventory Value</div>
            <div>{formatMoney(data.totalValuePaise, companyContext?.currency)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
