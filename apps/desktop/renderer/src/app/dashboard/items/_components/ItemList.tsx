'use client';

import { ProductListDto, TaxDto, UnitDto } from '@vyora/types';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function ItemList() {
  const router = useRouter();

  const [data, setData] = React.useState<ProductListDto>({ data: [], total: 0 });
  const [units, setUnits] = React.useState<Record<string, UnitDto>>({});
  const [taxes, setTaxes] = React.useState<Record<string, TaxDto>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterActive, setFilterActive] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = React.useState(0);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const limit = 20;

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const res = await window.vyora.db.products.delete(id);
        if (res.success) {
          alert('Item deleted successfully.');
          setRefreshTrigger((prev) => prev + 1);
        } else {
          alert(res.error || 'Failed to delete item.');
        }
      } catch {
        alert('An unexpected error occurred while deleting.');
      }
    }
  };

  // Fetch Lookups
  React.useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [unitRes, taxRes] = await Promise.all([
          window.vyora.db.units.getAll(),
          window.vyora.db.taxes.getAll(),
        ]);

        if (unitRes.success && unitRes.data) {
          const unitMap: Record<string, UnitDto> = {};
          unitRes.data.forEach((u: UnitDto) => {
            unitMap[u.id] = u;
          });
          setUnits(unitMap);
        }

        if (taxRes.success && taxRes.data) {
          const taxMap: Record<string, TaxDto> = {};
          taxRes.data.forEach((t: TaxDto) => {
            taxMap[t.id] = t;
          });
          setTaxes(taxMap);
        }
      } catch (e) {
        console.error('Failed to load lookups', e);
      }
    };
    fetchLookups();
  }, []);

  React.useEffect(() => {
    let isActiveValue: boolean | undefined = undefined;
    if (filterActive === 'ACTIVE') isActiveValue = true;
    if (filterActive === 'INACTIVE') isActiveValue = false;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.products.search({
          query: debouncedSearch,
          isActive: isActiveValue,
          limit,
          offset: page * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [debouncedSearch, filterActive, page, refreshTrigger]);

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground text-sm">
            Manage your inventory, non-inventory, and service items.
          </p>
        </div>
        <AppButton onClick={() => router.push('/dashboard/items/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </AppButton>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="relative w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Name, SKU, or HSN"
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
            <option value="ALL">All Items</option>
            <option value="ACTIVE">Active Items</option>
            <option value="INACTIVE">Inactive Items</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Item Details</th>
              <th className="px-6 py-3 font-medium">Type & HSN</th>
              <th className="px-6 py-3 font-medium">Unit & Tax</th>
              <th className="px-6 py-3 text-right font-medium">Pricing</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  Loading items...
                </td>
              </tr>
            ) : data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No items found.
                </td>
              </tr>
            ) : (
              data.data.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-muted-foreground text-xs">{item.sku || '-'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div>{item.itemType.replace(/_/g, ' ')}</div>
                    <div className="text-muted-foreground text-xs">HSN: {item.hsnCode || '-'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div>
                      {item.unitId && units[item.unitId] ? units[item.unitId].shortName : '-'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.taxId && taxes[item.taxId] ? taxes[item.taxId].name : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="font-medium">₹{item.salePrice.toFixed(2)}</div>
                    <div className="text-muted-foreground text-xs">
                      Pur: ₹{item.purchasePrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge variant={item.isActive ? 'success' : 'secondary'}>
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/items/${item.id}`)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </AppButton>
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </AppButton>
                    </div>
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
          Showing {data.data.length} of {data.total} items
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
