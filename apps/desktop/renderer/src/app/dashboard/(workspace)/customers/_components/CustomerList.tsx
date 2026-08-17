'use client';

import { CustomerProfileDto, CustomerListDto } from '@vyora/types';
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

export function CustomerList() {
  const router = useRouter();
  const { context: companyContext, loading: companyLoading } = useCompanyContext();

  const [data, setData] = React.useState<CustomerListDto>({ data: [], total: 0 });
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

    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.customers.search({
          query: debouncedSearch,
          isActive: isActiveValue,
          limit,
          offset: (page - 1) * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [debouncedSearch, filterActive, page]);

  const columns: ColumnDef<CustomerProfileDto>[] = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (c) => (
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-muted-foreground text-xs">{c.customerCode}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (c) => (
        <div>
          {c.mobile ? <div>{c.mobile}</div> : null}
          {c.email ? <div className="text-muted-foreground text-xs">{c.email}</div> : null}
          {!c.mobile && !c.email && <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      cell: (c) => c.gstin || <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      className: 'text-right',
      cell: (c) => {
        if (companyLoading || !companyContext?.currency)
          return <div className="font-medium">-</div>;
        return (
          <div>
            <div className="font-medium">
              {formatMoney(c.openingBalance, companyContext.currency)}
            </div>
            {c.openingBalance > 0 && c.openingType && (
              <div className="text-muted-foreground text-xs">{c.openingType}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <StatusBadge variant={c.isActive ? 'success' : 'secondary'}>
          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/customers/view?id=${c.id}`)}
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
        <SectionHeader title="Customers" description="Manage your customer master data." />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={data.data}
          columns={columns}
          keyExtractor={(item) => item.id}
          rowTestIdExtractor={(item) => `customer-row-${item.name}`}
          isLoading={isLoading}
          emptyMessage="No customers found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search by Name, Code, Mobile or GSTIN',
            actions: (
              <AppButton
                data-testid="create-customer-btn"
                onClick={() => router.push('/dashboard/customers/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
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
                  { label: 'All Customers', value: 'ALL' },
                  { label: 'Active Customers', value: 'ACTIVE' },
                  { label: 'Inactive Customers', value: 'INACTIVE' },
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
