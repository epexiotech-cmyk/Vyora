'use client';

import { VoucherListItemDto, VoucherFilterDto } from '@vyora/types';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { AppDatePicker } from '@/components/shared/form/AppDatePicker';
import { AppSelect } from '@/components/shared/form/AppSelect';
import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { AppInput } from '@/components/ui/AppInput';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function VoucherExplorer() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<VoucherListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VoucherFilterDto>({});

  const formatDate = (val?: string | Date) => {
    if (!val) return '';
    const d = new Date(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  useEffect(() => {
    const loadVouchers = async () => {
      setLoading(true);
      try {
        const res = await window.vyora.accounting.listVouchers(filters);
        if (res.success) {
          setVouchers(res.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadVouchers();
  }, [filters]);

  const columns: ColumnDef<VoucherListItemDto>[] = [
    { key: 'voucherNumber', header: 'Voucher Number' },
    { key: 'voucherType', header: 'Type' },
    {
      key: 'voucherDate',
      header: 'Date',
      cell: (row) => new Date(row.voucherDate).toLocaleDateString(),
    },
    { key: 'narration', header: 'Narration' },
    { key: 'status', header: 'Status', cell: (row) => (row.isCancelled ? 'Cancelled' : 'Active') },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Voucher Explorer" description="Search and filter accounting vouchers" />

      <div className="flex items-center space-x-4">
        <AppInput
          placeholder="Search Voucher Number"
          onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
        />
        <AppSelect
          options={[
            { label: 'All', value: '' },
            { label: 'Sales', value: 'Sales' },
            { label: 'Purchase', value: 'Purchase' },
            { label: 'Journal', value: 'Journal' },
            { label: 'Payment', value: 'Payment' },
            { label: 'Receipt', value: 'Receipt' },
            { label: 'Contra', value: 'Contra' },
          ]}
          value={filters.voucherType || ''}
          onChange={(v) =>
            setFilters((f) => ({ ...f, voucherType: typeof v === 'string' ? v : undefined }))
          }
          placeholder="Voucher Type"
        />
        <AppDatePicker
          label="From Date"
          value={formatDate(filters.fromDate)}
          onChange={(dateStr) =>
            setFilters((f) => ({
              ...f,
              fromDate: dateStr ? new Date(dateStr).toISOString() : undefined,
            }))
          }
        />
        <AppDatePicker
          label="To Date"
          value={formatDate(filters.toDate)}
          onChange={(dateStr) =>
            setFilters((f) => ({
              ...f,
              toDate: dateStr ? new Date(dateStr).toISOString() : undefined,
            }))
          }
        />
      </div>

      <DataTable
        data={vouchers}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        onRowClick={(item) => router.push('/dashboard/accounting/vouchers/' + item.id)}
      />
    </div>
  );
}
