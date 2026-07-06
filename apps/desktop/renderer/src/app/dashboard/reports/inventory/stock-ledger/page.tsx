'use client';

import { StockLedgerDto, StockLedgerRowDto, ProductDto, UnitDto } from '@vyora/types';
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';

import { AppDatePicker, DataTable, ColumnDef, TablePagination } from '@/components/shared';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function StockLedgerPage() {
  const [productId, setProductId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);

  const [data, setData] = useState<StockLedgerDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    let mounted = true;
    async function fetchLookups() {
      try {
        const [pRes, uRes] = await Promise.all([
          window.vyora.db.products.getAll(),
          window.vyora.db.units.getAll(),
        ]);
        if (mounted) {
          if (pRes.success && pRes.data) setProducts(pRes.data);
          if (uRes.success && uRes.data) setUnits(uRes.data);
        }
      } catch (e) {
        console.error('Failed to load lookup data', e);
      }
    }
    fetchLookups();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const product = products.find((p) => p.id === productId);
        const unit = units.find((u) => u.id === product?.unitId);

        const res = await window.vyora.reports.getStockLedger({
          productId,
          productName: product?.name || 'Unknown',
          unitShortName: unit?.shortName || 'Unknown',
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate: toDate ? new Date(toDate) : undefined,
        });

        if (!mounted) return;

        if (res.success && res.data) {
          setData(res.data);
          setPage(1);
        } else {
          setError(res.error || 'Failed to load Stock Ledger');
          setData(null);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Stock Ledger');
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
  }, [productId, fromDate, toDate, products, units]);

  const columns: ColumnDef<StockLedgerRowDto>[] = useMemo(
    () => [
      {
        key: 'movementDate',
        header: 'Date',
        cell: (row) => new Date(row.movementDate).toLocaleDateString(),
      },
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
        key: 'balanceQty',
        header: 'Balance Qty',
        className: 'text-right',
        cell: (row) => row.balanceQty.toFixed(4),
      },
      {
        key: 'ratePaise',
        header: 'Rate',
        className: 'text-right',
        cell: (row) => (row.ratePaise ? (row.ratePaise / 100).toFixed(2) : '-'),
      },
      { key: 'remarks', header: 'Remarks' },
    ],
    [],
  );

  const paginatedRows = useMemo(() => {
    if (!data?.rows) return [];
    const start = (page - 1) * pageSize;
    return data.rows.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stock Ledger"
        description="View detailed stock movements for a specific product"
      />

      <div className="bg-muted/20 flex items-end space-x-4 rounded border p-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium">Product *</label>
          <select
            className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            value={productId}
            onChange={(e) => {
              const val = e.target.value;
              setProductId(val);
              if (!val) setData(null);
            }}
          >
            <option value="">Select a Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
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
          <div className="bg-card text-card-foreground rounded border p-4">
            <h3 className="text-muted-foreground text-sm font-medium">Opening Quantity</h3>
            <p className="text-2xl font-bold">{data.openingQuantity.toFixed(4)}</p>
          </div>

          <div className="overflow-hidden rounded-md border">
            <DataTable
              data={paginatedRows}
              columns={columns}
              keyExtractor={(item) => item.movementId}
              isLoading={loading}
            />
          </div>

          <div className="bg-card text-card-foreground rounded border p-4">
            <h3 className="text-muted-foreground text-sm font-medium">Closing Quantity</h3>
            <p className="text-2xl font-bold">{data.closingQuantity.toFixed(4)}</p>
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalRecords={data.rows.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
