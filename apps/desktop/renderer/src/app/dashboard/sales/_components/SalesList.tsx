'use client';

import { SalesInvoiceDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Plus, Edit2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { DataTable, ColumnDef, AppSelect } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function SalesList() {
  const router = useRouter();
  const { context } = useCompanyContext();

  const [data, setData] = React.useState<SalesInvoiceDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<
    'ALL' | 'DRAFT' | 'SUBMITTED' | 'CANCELLED'
  >('ALL');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  React.useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.sales.list({
          limit,
          offset: (page - 1) * limit,
        });
        if (res.success && res.data) {
          // Client-side filtering as existing list API lacks search params
          let filtered = res.data;

          if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (i) =>
                i.invoiceNumber.toLowerCase().includes(lowerQ) ||
                i.customerId.toLowerCase().includes(lowerQ),
            );
          }

          if (filterStatus !== 'ALL') {
            filtered = filtered.filter((i) => i.status === filterStatus);
          }

          setData(filtered);
          setTotal(res.data.length); // Approximated for client filtering
        }
      } catch (error) {
        console.error('Failed to fetch sales invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, [searchQuery, filterStatus, page]);

  const columns: ColumnDef<SalesInvoiceDto>[] = [
    {
      key: 'invoiceDetails',
      header: 'Invoice Details',
      cell: (i) => (
        <div>
          <div className="font-medium">{i.invoiceNumber}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(i.invoiceDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (i) => (
        <div>
          <div className="font-medium">{i.customerId}</div>
        </div>
      ),
    },
    {
      key: 'grandTotal',
      header: 'Grand Total',
      className: 'text-right',
      cell: (i) => (
        <div className="font-medium">{formatMoney(i.grandTotal, context!.currency)}</div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (i) => (
        <StatusBadge
          variant={
            i.status === 'SUBMITTED' ? 'success' : i.status === 'DRAFT' ? 'warning' : 'destructive'
          }
        >
          {i.status}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (i) => (
        <div className="flex items-center justify-end gap-2">
          {/* Always show View/Search icon or similar, or just edit if draft */}
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/sales/${i.id}/edit`)}
          >
            {i.status === 'DRAFT' ? <Edit2 className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            <span className="sr-only">{i.status === 'DRAFT' ? 'Edit' : 'View'}</span>
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader
          title="Sales Invoices"
          description="Manage your sales invoices and billing."
        />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No sales invoices found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search by Invoice Number or Customer ID...',
            actions: (
              <AppButton onClick={() => router.push('/dashboard/sales/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </AppButton>
            ),
            filters: (
              <AppSelect
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as 'ALL' | 'DRAFT' | 'SUBMITTED' | 'CANCELLED');
                  setPage(1);
                }}
                options={[
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Submitted', value: 'SUBMITTED' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ]}
                className="w-48"
              />
            ),
          }}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: total,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}
