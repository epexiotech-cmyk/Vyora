'use client';

import { SupplierListDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { Plus, Search, Filter, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function SupplierList() {
  const router = useRouter();

  const [data, setData] = React.useState<SupplierListDto>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterActive, setFilterActive] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = React.useState(0);
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
          offset: page * limit,
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

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Manage your supplier master data.</p>
        </div>
        <AppButton onClick={() => router.push('/dashboard/suppliers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </AppButton>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="relative w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Name, Code, Mobile or GSTIN"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent py-1 pr-3 pl-9 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
              setPage(0);
            }}
            className="border-input focus-visible:ring-ring h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="ALL">All Suppliers</option>
            <option value="ACTIVE">Active Suppliers</option>
            <option value="INACTIVE">Inactive Suppliers</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Supplier</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">GSTIN</th>
              <th className="px-6 py-3 text-right font-medium">Balance</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  Loading suppliers...
                </td>
              </tr>
            ) : data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              data.data.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-muted-foreground text-xs">{supplier.supplierCode}</div>
                  </td>
                  <td className="px-6 py-3">
                    {supplier.mobile ? <div>{supplier.mobile}</div> : null}
                    {supplier.email ? (
                      <div className="text-muted-foreground text-xs">{supplier.email}</div>
                    ) : null}
                    {!supplier.mobile && !supplier.email && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {supplier.gstin || <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="font-medium">{formatCurrency(supplier.openingBalance)}</div>
                    {supplier.openingBalance > 0 && supplier.openingType && (
                      <div className="text-muted-foreground text-xs">{supplier.openingType}</div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge variant={supplier.isActive ? 'success' : 'secondary'}>
                      {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <AppButton
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/suppliers/${supplier.id}`)}
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </AppButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t px-6 py-3">
        <p className="text-muted-foreground text-sm">
          Showing {data.data.length} of {data.total} suppliers
        </p>
        <div className="flex items-center gap-2">
          <AppButton
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </AppButton>
          <AppButton
            variant="outline"
            size="sm"
            disabled={(page + 1) * limit >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AppButton>
        </div>
      </div>
    </div>
  );
}
