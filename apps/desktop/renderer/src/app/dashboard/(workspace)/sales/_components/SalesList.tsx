'use client';

import { SalesInvoiceDto } from '@vyora/types';
import { ExportFormat, ExportColumn, ExportRecord } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Plus, Edit2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { DataTable, ColumnDef, AppSelect } from '@/components/shared';
import { AppExportDropdown } from '@/components/shared/AppExportDropdown';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useExport } from '@/hooks/useExport';
import { generateExportFilename } from '@/lib/exportUtils';

export function SalesList() {
  const router = useRouter();
  const { context } = useCompanyContext();

  const [data, setData] = React.useState<SalesInvoiceDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const { exportData, isExporting } = useExport();

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
          query: searchQuery.trim() || undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        });
        if (res.success && res.data) {
          const { data: records, total: totalRecords } = res.data;
          setData(records);
          setTotal(totalRecords);
        }
      } catch (error) {
        console.error('Failed to fetch sales invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, [searchQuery, filterStatus, page]);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const columns: ExportColumn[] = [
      { key: 'invoiceNumber', header: 'Invoice Number', type: 'string' },
      { key: 'invoiceDate', header: 'Invoice Date', type: 'date' },
      { key: 'customer', header: 'Customer', type: 'string' },
      { key: 'grandTotal', header: 'Grand Total', type: 'currency' },
      { key: 'status', header: 'Status', type: 'string' },
    ];

    const exportRecords: ExportRecord[] = data.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate),
      customer: invoice.customerId,
      grandTotal: invoice.grandTotal,
      status: invoice.status,
    }));

    const filename = generateExportFilename('Sales_Register', format);

    await exportData(format, filename, columns, exportRecords, {
      title: 'Sales Register',
      companyName: context?.company?.legalName,
      searchQuery,
      filterStatus,
    });
  };

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
        <div className="font-medium">{formatMoney(i.grandTotal, context?.currency)}</div>
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
            onClick={() => router.push(`/dashboard/sales/edit?id=${i.id}`)}
          >
            {i.status === 'CANCELLED' ? (
              <Search className="h-4 w-4" />
            ) : (
              <Edit2 className="h-4 w-4" />
            )}
            <span className="sr-only">{i.status === 'CANCELLED' ? 'View' : 'Edit'}</span>
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
          actions={<AppExportDropdown onExport={handleExport} isExporting={isExporting} />}
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
              <AppButton
                onClick={() => router.push('/dashboard/sales/new')}
                data-testid="create-sales-btn"
              >
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
