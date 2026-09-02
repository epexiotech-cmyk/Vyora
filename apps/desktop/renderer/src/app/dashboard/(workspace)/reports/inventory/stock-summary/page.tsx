'use client';

import { StockSummaryDto, StockSummaryRowDto } from '@vyora/types';
import { ExportFormat, ExportColumn, ExportRecord } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export default function StockSummaryPage() {
  const { context: companyContext } = useCompanyContext();
  const [data, setData] = useState<StockSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { exportData, isExporting } = useExport();

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

  const handleExport = async (format: ExportFormat) => {
    if (!data || !data.rows || data.rows.length === 0) {
      alert('No data available to export');
      return;
    }

    const exportColumns: ExportColumn[] = [
      { key: 'productName', header: 'Product', type: 'string' },
      { key: 'sku', header: 'SKU', type: 'string' },
      { key: 'unitShortName', header: 'Unit', type: 'string' },
      { key: 'closingQuantity', header: 'Closing Quantity', type: 'number' },
      { key: 'wac', header: 'WAC', type: 'currency' },
      { key: 'totalValue', header: 'Inventory Value', type: 'currency' },
    ];

    const exportRecords: ExportRecord[] = data.rows.map((row) => ({
      productName: row.productName,
      sku: row.sku || '',
      unitShortName: row.unitShortName,
      closingQuantity: row.closingQuantity,
      wac: row.wacPaise ? row.wacPaise / 100 : 0,
      totalValue: row.totalValuePaise ? row.totalValuePaise / 100 : 0,
    }));

    const filename = generateExportFilename('Stock_Summary', format);

    await exportData(
      format,
      filename,
      exportColumns,
      exportRecords,
      {
        title: 'Stock Summary',
        companyName: companyContext?.company?.legalName,
      },
      {
        'Total Inventory Value': data.totalValuePaise ? data.totalValuePaise / 100 : 0,
      },
    );
  };

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
        actions={<AppExportDropdown onExport={handleExport} isExporting={isExporting} />}
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
