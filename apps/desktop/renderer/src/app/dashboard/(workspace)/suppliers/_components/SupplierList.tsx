'use client';

import { SupplierProfileDto, SupplierListDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Plus, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { DataTable, ColumnDef, AppSelect } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function SupplierList() {
  const router = useRouter();
  const { context: companyContext, loading: companyLoading } = useCompanyContext();

  const [data, setData] = React.useState<SupplierListDto>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterActive, setFilterActive] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  React.useEffect(() => {
    let isActiveValue: boolean | undefined = undefined;
    if (filterActive === 'ACTIVE') isActiveValue = true;
    if (filterActive === 'INACTIVE') isActiveValue = false;

    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.suppliers.search({
          query: debouncedSearch,
          isActive: isActiveValue,
          limit,
          offset: (page - 1) * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [debouncedSearch, filterActive, page]);

  const columns: ColumnDef<SupplierProfileDto>[] = [
    {
      key: 'supplier',
      header: 'Supplier',
      cell: (s) => (
        <div>
          <div className="font-medium">{s.name}</div>
          <div className="text-muted-foreground text-xs">{s.supplierCode}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (s) => (
        <div>
          {s.mobile ? <div>{s.mobile}</div> : null}
          {s.email ? <div className="text-muted-foreground text-xs">{s.email}</div> : null}
          {!s.mobile && !s.email && <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      cell: (s) => s.gstin || <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      className: 'text-right',
      cell: (s) => {
        if (companyLoading || !companyContext?.currency)
          return <div className="font-medium">-</div>;
        return (
          <div>
            <div className="font-medium">
              {formatMoney(s.openingBalance, companyContext.currency)}
            </div>
            {s.openingBalance > 0 && s.openingType && (
              <div className="text-muted-foreground text-xs">{s.openingType}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <StatusBadge variant={s.isActive ? 'success' : 'secondary'}>
          {s.isActive ? 'ACTIVE' : 'INACTIVE'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (s) => (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/suppliers/view?id=${s.id}`)}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </AppButton>
      ),
    },
  ];

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader title="Suppliers" description="Manage your supplier master data." />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={data.data}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No suppliers found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search by Name, Code, Mobile or GSTIN',
            actions: (
              <AppButton
                data-testid="create-supplier-btn"
                onClick={() => router.push('/dashboard/suppliers/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </AppButton>
            ),
            filters: (
              <AppSelect
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                  setPage(1);
                }}
                options={[
                  { label: 'All Suppliers', value: 'ALL' },
                  { label: 'Active Suppliers', value: 'ACTIVE' },
                  { label: 'Inactive Suppliers', value: 'INACTIVE' },
                ]}
                className="w-48"
              />
            ),
          }}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: data.total,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}
